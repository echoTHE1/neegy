import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/components/nexus/toast";
import {
  clearMessagesFn,
  deleteMessageFn,
  deleteRoomFn,
  editMessageFn,
  getRoomStateFn,
  leaveRoomFn,
  loadOlderFn,
  pingRoomFn,
  regenerateCodeFn,
  removeMemberFn,
  sendMessageFn,
  toggleReactionFn,
  updateRoomFn,
} from "@/lib/nexus.functions";
import {
  ERROR_COPY,
  type MemberDTO,
  type MessageDTO,
  type NexusErrorCode,
  type RoomDTO,
} from "@/lib/nexus/types";

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "offline";
export type RoomStatus = "loading" | "ready" | "closed" | "error";

type Typing = { id: string; name: string; at: number };

const TYPING_TTL = 4000;

export function useNexusRoom(roomId: string, token: string, memberId: string) {
  const [status, setStatus] = useState<RoomStatus>("loading");
  const [closedReason, setClosedReason] = useState<NexusErrorCode | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [room, setRoom] = useState<RoomDTO | null>(null);
  const [me, setMe] = useState<MemberDTO | null>(null);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [typing, setTyping] = useState<Typing[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingSent = useRef(0);

  const handleFailure = useCallback((code: NexusErrorCode) => {
    if (
      code === "ROOM_CLOSED" ||
      code === "REMOVED" ||
      code === "NOT_A_MEMBER" ||
      code === "ROOM_NOT_FOUND"
    ) {
      setClosedReason(code);
      setStatus("closed");
      return;
    }
    const copy = ERROR_COPY[code];
    notify.error(copy.title, copy.detail);
  }, []);

  const upsertMessage = useCallback((message: MessageDTO) => {
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === message.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = message;
        return next;
      }
      return [...prev, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
  }, []);

  const broadcast = useCallback((event: string, payload: unknown) => {
    void channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  const refresh = useCallback(async () => {
    const result = await getRoomStateFn({ data: { roomId, token } });
    if (!result.ok) {
      handleFailure(result.error);
      return;
    }
    setRoom(result.room);
    setMe(result.me);
    setMembers(result.members);
    setMessages(result.messages);
    setHasMore(result.hasMore);
    setStatus("ready");
  }, [roomId, token, handleFailure]);

  const softRefresh = useCallback(async () => {
    try {
      const result = await pingRoomFn({ data: { roomId, token } });
      if (!result.ok) {
        handleFailure(result.error);
        return;
      }
      setRoom(result.room);
      setMembers(result.members);
      setConnection((prev) => (prev === "connected" ? prev : "connected"));
    } catch {
      setConnection("reconnecting");
    }
  }, [roomId, token, handleFailure]);

  /* Initial load */
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    getRoomStateFn({ data: { roomId, token } })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          handleFailure(result.error);
          return;
        }
        setRoom(result.room);
        setMe(result.me);
        setMembers(result.members);
        setMessages(result.messages);
        setHasMore(result.hasMore);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, token, handleFailure]);

  /* Realtime channel: broadcast fan-out + presence */
  useEffect(() => {
    if (!memberId) return;
    const channel = supabase.channel(`nexus:${roomId}`, {
      config: { presence: { key: memberId }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        upsertMessage(payload as MessageDTO);
      })
      .on("broadcast", { event: "message-update" }, ({ payload }) => {
        upsertMessage(payload as MessageDTO);
      })
      .on("broadcast", { event: "sync" }, () => {
        void softRefresh();
      })
      .on("broadcast", { event: "history" }, () => {
        void refresh();
      })
      .on("broadcast", { event: "closed" }, () => {
        setClosedReason("ROOM_CLOSED");
        setStatus("closed");
      })
      .on("broadcast", { event: "kick" }, ({ payload }) => {
        if ((payload as { memberId: string }).memberId === memberId) {
          setClosedReason("REMOVED");
          setStatus("closed");
        } else {
          void softRefresh();
        }
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const data = payload as { memberId: string; name: string; active?: boolean };
        if (data.memberId === memberId) return;
        setTyping((prev) =>
          data.active === false
            ? prev.filter((t) => t.id !== data.memberId)
            : [
                ...prev.filter((t) => t.id !== data.memberId),
                { id: data.memberId, name: data.name, at: Date.now() },
              ],
        );
      })
      .on("presence", { event: "sync" }, () => {
        setOnlineIds(Object.keys(channel.presenceState()));
      })
      .subscribe((state) => {
        if (state === "SUBSCRIBED") {
          setConnection("connected");
          void channel.track({ online_at: new Date().toISOString() });
          // Tell everyone already in the room to pull the new roster / history.
          void channel.send({ type: "broadcast", event: "history", payload: {} });
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          setConnection("reconnecting");
        } else if (state === "CLOSED") {
          setConnection((prev) => (prev === "connected" ? "reconnecting" : prev));
        }
      });

    return () => {
      void channel.send({
        type: "broadcast",
        event: "typing",
        payload: { memberId, name: "", active: false },
      });
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [roomId, memberId, upsertMessage, softRefresh, refresh]);

  /* Typing expiry */
  useEffect(() => {
    if (typing.length === 0) return;
    const timer = setInterval(() => {
      setTyping((prev) => prev.filter((t) => Date.now() - t.at < TYPING_TTL));
    }, 1000);
    return () => clearInterval(timer);
  }, [typing.length]);

  /* Heartbeat + browser connectivity */
  useEffect(() => {
    const timer = setInterval(() => void softRefresh(), 25_000);
    const goOffline = () => setConnection("offline");
    const goOnline = () => {
      setConnection("reconnecting");
      void softRefresh();
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      clearInterval(timer);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [softRefresh]);

  /* ------------------------------------------------------------ actions */

  const send = useCallback(
    async (body: string, replyTo: string | null) => {
      const result = await sendMessageFn({ data: { roomId, token, body, replyTo } });
      if (!result.ok) {
        handleFailure(result.error);
        return false;
      }
      upsertMessage(result.message);
      broadcast("message", result.message);
      broadcast("typing", { memberId, name: "", active: false });
      return true;
    },
    [roomId, token, memberId, handleFailure, upsertMessage, broadcast],
  );

  const edit = useCallback(
    async (messageId: string, body: string) => {
      const result = await editMessageFn({ data: { roomId, token, messageId, body } });
      if (!result.ok) return handleFailure(result.error);
      upsertMessage(result.message);
      broadcast("message-update", result.message);
    },
    [roomId, token, handleFailure, upsertMessage, broadcast],
  );

  const remove = useCallback(
    async (messageId: string) => {
      const result = await deleteMessageFn({ data: { roomId, token, messageId } });
      if (!result.ok) return handleFailure(result.error);
      upsertMessage(result.message);
      broadcast("message-update", result.message);
      notify.success("Message deleted");
    },
    [roomId, token, handleFailure, upsertMessage, broadcast],
  );

  const react = useCallback(
    async (messageId: string, emoji: string) => {
      const result = await toggleReactionFn({ data: { roomId, token, messageId, emoji } });
      if (!result.ok) return handleFailure(result.error);
      upsertMessage(result.message);
      broadcast("message-update", result.message);
    },
    [roomId, token, handleFailure, upsertMessage, broadcast],
  );

  const loadOlder = useCallback(async () => {
    const oldest = messages[0];
    if (!oldest) return;
    const result = await loadOlderFn({ data: { roomId, token, before: oldest.createdAt } });
    if (!result.ok) return handleFailure(result.error);
    setMessages((prev) => [...result.messages, ...prev]);
    setHasMore(result.hasMore);
  }, [messages, roomId, token, handleFailure]);

  const sendTyping = useCallback(
    (active: boolean) => {
      if (!active) {
        lastTypingSent.current = 0;
        broadcast("typing", { memberId, name: "", active: false });
        return;
      }
      const now = Date.now();
      if (now - lastTypingSent.current < 1800) return;
      lastTypingSent.current = now;
      broadcast("typing", { memberId, name: me?.displayName ?? "Someone", active: true });
    },
    [broadcast, memberId, me?.displayName],
  );

  const owner = useMemo(
    () => ({
      rename: async (name: string, description: string) => {
        const result = await updateRoomFn({ data: { roomId, token, name, description } });
        if (!result.ok) return handleFailure(result.error);
        setRoom(result.room);
        broadcast("history", {});
        notify.success("Room updated");
      },
      regenerate: async () => {
        const result = await regenerateCodeFn({ data: { roomId, token } });
        if (!result.ok) return handleFailure(result.error);
        setRoom(result.room);
        broadcast("history", {});
        notify.success("New access code generated");
        return result.room.code;
      },
      kick: async (targetId: string) => {
        const result = await removeMemberFn({ data: { roomId, token, memberId: targetId } });
        if (!result.ok) return handleFailure(result.error);
        setMembers(result.members);
        broadcast("kick", { memberId: targetId });
        broadcast("history", {});
        notify.success("Member removed");
      },
      clear: async () => {
        const result = await clearMessagesFn({ data: { roomId, token } });
        if (!result.ok) return handleFailure(result.error);
        await refresh();
        broadcast("history", {});
        notify.success("Messages cleared");
      },
      destroy: async () => {
        const result = await deleteRoomFn({ data: { roomId, token } });
        if (!result.ok) return handleFailure(result.error);
        broadcast("closed", {});
        setClosedReason("ROOM_CLOSED");
        setStatus("closed");
      },
    }),
    [roomId, token, handleFailure, broadcast, refresh],
  );

  const leave = useCallback(async () => {
    await leaveRoomFn({ data: { roomId, token } });
    broadcast("history", {});
  }, [roomId, token, broadcast]);

  return {
    status,
    closedReason,
    connection,
    room,
    me,
    members,
    messages,
    hasMore,
    onlineIds,
    typing,
    actions: { send, edit, remove, react, loadOlder, sendTyping, refresh, leave, owner },
  };
}
