import { Link, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowDown,
  Crown,
  Info,
  KeyRound,
  LogOut,
  RefreshCw,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BackgroundFX } from "@/components/nexus/BackgroundFX";
import { ConnectionBadge } from "@/components/nexus/ConnectionBadge";
import { InviteCode } from "@/components/nexus/InviteCode";
import { MemberList } from "@/components/nexus/MemberList";
import { MessageBubble, SystemMessage } from "@/components/nexus/MessageBubble";
import { MessageComposer } from "@/components/nexus/MessageComposer";
import { Modal } from "@/components/nexus/Modal";
import { NexusLockup } from "@/components/nexus/NexusLogo";
import { TypingIndicator } from "@/components/nexus/TypingIndicator";
import {
  Button,
  Field,
  GlassCard,
  HudTag,
  Skeleton,
  TextArea,
  TextInput,
} from "@/components/nexus/primitives";
import { useNexusRoom } from "@/hooks/useNexusRoom";
import { clearSession, loadSession } from "@/lib/nexus/session";
import { LIMITS } from "@/lib/nexus/validation";
import { ERROR_COPY, type MemberDTO, type MessageDTO, type SessionDTO } from "@/lib/nexus/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/room/$roomId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Room — NEXUS" },
      { name: "description", content: "Your private real-time NEXUS group chat room." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "NEXUS Room" },
      { property: "og:description", content: "A private, invite-only real-time group chat." },
    ],
  }),
  component: RoomGate,
});

function RoomGate() {
  const { roomId } = useParams({ from: "/room/$roomId" });
  const [session, setSession] = useState<SessionDTO | null | undefined>(undefined);

  useEffect(() => {
    const stored = loadSession();
    setSession(stored && stored.roomId === roomId ? stored : null);
  }, [roomId]);

  if (session === undefined) return <RoomSkeleton />;
  if (!session) return <NoAccess />;
  return <Room key={session.memberId} session={session} />;
}

function RoomSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex-1 space-y-4 p-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={cn("h-12", i % 2 ? "ml-auto w-2/5" : "w-3/5")} />
        ))}
      </div>
    </div>
  );
}

function Shell({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <BackgroundFX />
      <GlassCard className="animate-scale-in relative z-10 w-full max-w-md p-7 text-center">
        <NexusLockup className="justify-center" />
        <h1 className="mt-5 font-display text-lg font-bold tracking-[0.12em] uppercase">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {children}
          <Link to="/">
            <Button variant="outline" className="w-full">
              Back home
            </Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

function NoAccess() {
  return (
    <Shell
      title="Access required"
      body="You don't have an active session for this room. Enter the access code to join."
    >
      <Link to="/join">
        <Button className="w-full">
          <KeyRound className="h-4 w-4" /> Enter code
        </Button>
      </Link>
    </Shell>
  );
}

function Room({ session }: { session: SessionDTO }) {
  const navigate = useNavigate();
  const {
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
    actions,
  } = useNexusRoom(session.roomId, session.token, session.memberId);

  const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; body: string; action: () => void }>(
    null,
  );
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const amOwner = Boolean(me?.isOwner);

  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const scrollToBottom = useCallback((smooth = true) => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    if (status === "ready") scrollToBottom(false);
  }, [status, scrollToBottom]);

  useEffect(() => {
    if (atBottom) scrollToBottom();
  }, [messages.length, atBottom, scrollToBottom]);

  useEffect(() => {
    if (status !== "closed") return;
    clearSession();
  }, [status]);

  if (status === "loading") return <RoomSkeleton />;

  if (status === "error") {
    return (
      <Shell
        title={ERROR_COPY.SERVER_ERROR.title}
        body="We couldn't load this room. Check your connection and try again."
      >
        <Button onClick={() => void actions.refresh()}>Try again</Button>
      </Shell>
    );
  }

  if (status === "closed") {
    const copy = ERROR_COPY[closedReason ?? "ROOM_CLOSED"];
    return (
      <Shell title={copy.title} body={copy.detail}>
        <Link to="/join">
          <Button className="w-full">Join another room</Button>
        </Link>
      </Shell>
    );
  }

  if (!room || !me) return <RoomSkeleton />;

  const typingNames = typing.map((t) => t.name);
  const onlineCount = members.filter((m) => onlineIds.includes(m.id)).length;

  const leaveRoom = async () => {
    await actions.leave();
    clearSession();
    
    void navigate({ to: "/" });
  };

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-background">
      <BackgroundFX />

      {/* Header */}
      <header className="relative z-20 flex items-center gap-3 border-b border-border bg-background/70 px-3 py-2.5 backdrop-blur-xl sm:px-4">
        <Link to="/" aria-label="NEXUS home" className="hidden sm:block">
          <NexusLockup className="scale-90" />
        </Link>
        <div className="min-w-0 flex-1 sm:border-l sm:border-border sm:pl-3">
          <h1 className="truncate font-display text-sm font-bold tracking-[0.12em] uppercase">
            {room.name}
          </h1>
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <ConnectionBadge state={connection} />
            <HudTag className="text-muted-foreground">
              {members.length} member{members.length === 1 ? "" : "s"} · {onlineCount} online
            </HudTag>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="icon"
            size="icon"
            aria-label="Invite code"
            onClick={() => setShowInvite(true)}
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button
            variant="icon"
            size="icon"
            aria-label="Members"
            className="lg:hidden"
            onClick={() => setShowMembers(true)}
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            variant="icon"
            size="icon"
            aria-label="Room settings"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="relative z-10 flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            onScroll={(event) => {
              const el = event.currentTarget;
              setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
            }}
            className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5"
          >
            {hasMore && (
              <div className="mb-3 flex justify-center">
                <Button size="sm" variant="outline" onClick={() => void actions.loadOlder()}>
                  Load earlier messages
                </Button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Info className="h-5 w-5 text-primary" aria-hidden />
                <p className="mt-3 font-display text-xs tracking-[0.16em] uppercase">
                  No messages yet
                </p>
                <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
                  Say hello, or share the access code so your people can join.
                </p>
              </div>
            )}

            {messages.map((message) =>
              message.kind === "system" ? (
                <SystemMessage key={message.id} message={message} />
              ) : (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMine={message.memberId === me.id}
                  myMemberId={me.id}
                  replyTarget={message.replyTo ? byId.get(message.replyTo) : undefined}
                  showTimestamp
                  compact={false}
                  canDelete={amOwner}
                  onReply={setReplyTo}
                  onReact={(id, emoji) => void actions.react(id, emoji)}
                  onEdit={(id, body) => void actions.edit(id, body)}
                  onDelete={(id) => void actions.remove(id)}
                />
              ),
            )}
          </div>

          {!atBottom && (
            <button
              type="button"
              aria-label="Jump to latest messages"
              onClick={() => scrollToBottom()}
              className="glass animate-slide-up absolute bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs text-foreground shadow-[var(--shadow-panel)]"
            >
              <ArrowDown className="mr-1 inline h-3 w-3" /> Latest
            </button>
          )}

          <div className="px-4">
            <TypingIndicator names={typingNames} />
          </div>

          <MessageComposer
            roomName={room.name}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            onSend={(body) => actions.send(body, replyTo?.id ?? null)}
            onTyping={actions.sendTyping}
            disabled={connection === "offline"}
          />
        </main>

        {/* Desktop member rail */}
        <aside className="hidden w-72 shrink-0 flex-col border-l border-border bg-background/50 backdrop-blur-xl lg:flex">
          <div className="border-b border-border px-4 py-3">
            <p className="hud-label">Members</p>
          </div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
            <MemberList
              members={members}
              onlineIds={onlineIds}
              myId={me.id}
              amOwner={amOwner}
              onRemove={(member) => askRemove(member)}
            />
          </div>
          <div className="border-t border-border p-3">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => void leaveRoom()}>
              <LogOut className="h-3.5 w-3.5" /> Leave room
            </Button>
          </div>
        </aside>
      </div>

      {/* Members modal (mobile) */}
      <Modal
        open={showMembers}
        onOpenChange={setShowMembers}
        eyebrow={`${onlineCount} online`}
        title="Members"
        description="Everyone with access to this room."
      >
        <MemberList
          members={members}
          onlineIds={onlineIds}
          myId={me.id}
          amOwner={amOwner}
          onRemove={(member) => {
            setShowMembers(false);
            askRemove(member);
          }}
        />
        <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => void leaveRoom()}>
          <LogOut className="h-3.5 w-3.5" /> Leave room
        </Button>
      </Modal>

      {/* Invite modal */}
      <Modal
        open={showInvite}
        onOpenChange={setShowInvite}
        eyebrow="Invite"
        title="Access code"
        description="Only people with this code can join the room."
      >
        <InviteCode code={room.code} roomName={room.name} />
        {amOwner && (
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => void actions.owner.regenerate()}
          >
            <RefreshCw className="h-4 w-4" /> Generate new code
          </Button>
        )}
      </Modal>

      {/* Settings modal */}
      <SettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        amOwner={amOwner}
        name={room.name}
        description={room.description ?? ""}
        onSave={(name, description) => void actions.owner.rename(name, description)}
        onClear={() =>
          setConfirm({
            title: "Clear all messages?",
            body: "Every message in this room will be permanently deleted for all members.",
            action: () => void actions.owner.clear(),
          })
        }
        onDestroy={() =>
          setConfirm({
            title: "Delete this room?",
            body: "The room closes immediately for everyone and cannot be recovered.",
            action: () => void actions.owner.destroy(),
          })
        }
        onLeave={() => void leaveRoom()}
      />

      {/* Confirm modal */}
      <Modal
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        eyebrow="Confirm"
        title={confirm?.title ?? ""}
        description={confirm?.body ?? ""}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              confirm?.action();
              setConfirm(null);
              setShowSettings(false);
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );

  function askRemove(member: MemberDTO) {
    setConfirm({
      title: `Remove ${member.displayName}?`,
      body: "They lose access immediately. They can rejoin only with a valid access code.",
      action: () => void actions.owner.kick(member.id),
    });
  }
}


function SettingsModal({
  open,
  onOpenChange,
  amOwner,
  name,
  description,
  onSave,
  onClear,
  onDestroy,
  onLeave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amOwner: boolean;
  name: string;
  description: string;
  onSave: (name: string, description: string) => void;
  onClear: () => void;
  onDestroy: () => void;
  onLeave: () => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [draftDescription, setDraftDescription] = useState(description);

  useEffect(() => {
    if (open) {
      setDraftName(name);
      setDraftDescription(description);
    }
  }, [open, name, description]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={amOwner ? "Owner controls" : "Room"}
      title="Room settings"
      description={amOwner ? "Manage this room." : "Details about this room."}
    >
      {amOwner ? (
        <div className="space-y-5">
          <Field label="Room name" htmlFor="settingsName" counter={`${draftName.length}/${LIMITS.roomName}`}>
            <TextInput
              id="settingsName"
              value={draftName}
              maxLength={LIMITS.roomName}
              onChange={(event) => setDraftName(event.target.value)}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="settingsDescription"
            counter={`${draftDescription.length}/${LIMITS.description}`}
          >
            <TextArea
              id="settingsDescription"
              rows={3}
              value={draftDescription}
              maxLength={LIMITS.description}
              onChange={(event) => setDraftDescription(event.target.value)}
            />
          </Field>
          <Button
            className="w-full"
            disabled={!draftName.trim()}
            onClick={() => onSave(draftName.trim(), draftDescription.trim())}
          >
            Save changes
          </Button>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="hud-label inline-flex items-center gap-1.5 text-warning">
              <Crown className="h-3 w-3" /> Danger zone
            </p>
            <Button variant="danger" className="w-full" onClick={onClear}>
              <Trash2 className="h-4 w-4" /> Clear all messages
            </Button>
            <Button variant="danger" className="w-full" onClick={onDestroy}>
              <Trash2 className="h-4 w-4" /> Delete room
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="hud-label">Room</p>
            <p className="mt-1 text-sm">{name}</p>
          </div>
          {description && (
            <div>
              <p className="hud-label">About</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          )}
          <Button variant="danger" className="w-full" onClick={onLeave}>
            <LogOut className="h-4 w-4" /> Leave room
          </Button>
        </div>
      )}
    </Modal>
  );
}
