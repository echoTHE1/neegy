import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { LIMITS } from "./nexus/validation";

const roomAuth = {
  roomId: z.string().uuid(),
  token: z.string().min(16).max(200),
};

const core = () => import("./nexus/core.server");

export const createRoomFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        displayName: z.string().min(1).max(LIMITS.displayName + 20),
        roomName: z.string().min(1).max(LIMITS.roomName + 20),
        description: z.string().max(LIMITS.description + 40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => (await core()).createRoom(data));

export const joinRoomFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        displayName: z.string().min(1).max(LIMITS.displayName + 20),
        code: z.string().min(3).max(32),
      })
      .parse(data),
  )
  .handler(async ({ data }) => (await core()).joinRoom(data));

export const getRoomStateFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object(roomAuth).parse(data))
  .handler(async ({ data }) => (await core()).getRoomState(data));

export const loadOlderFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ ...roomAuth, before: z.string() }).parse(data))
  .handler(async ({ data }) => (await core()).loadOlderMessages(data));

export const sendMessageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        ...roomAuth,
        body: z.string().min(1).max(LIMITS.message + 500),
        replyTo: z.string().uuid().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => (await core()).sendMessage(data));

export const editMessageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        ...roomAuth,
        messageId: z.string().uuid(),
        body: z.string().min(1).max(LIMITS.message + 500),
      })
      .parse(data),
  )
  .handler(async ({ data }) => (await core()).editMessage(data));

export const deleteMessageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ ...roomAuth, messageId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => (await core()).deleteMessage(data));

export const toggleReactionFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({ ...roomAuth, messageId: z.string().uuid(), emoji: z.string().min(1).max(8) })
      .parse(data),
  )
  .handler(async ({ data }) => (await core()).toggleReaction(data));

export const pingRoomFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object(roomAuth).parse(data))
  .handler(async ({ data }) => (await core()).pingRoom(data));

export const leaveRoomFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object(roomAuth).parse(data))
  .handler(async ({ data }) => (await core()).leaveRoom(data));

export const updateRoomFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        ...roomAuth,
        name: z.string().min(1).max(LIMITS.roomName + 20),
        description: z.string().max(LIMITS.description + 40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => (await core()).updateRoom(data));

export const regenerateCodeFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object(roomAuth).parse(data))
  .handler(async ({ data }) => (await core()).regenerateCode(data));

export const removeMemberFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ ...roomAuth, memberId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => (await core()).removeMember(data));

export const clearMessagesFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object(roomAuth).parse(data))
  .handler(async ({ data }) => (await core()).clearMessages(data));

export const deleteRoomFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object(roomAuth).parse(data))
  .handler(async ({ data }) => (await core()).deleteRoom(data));
