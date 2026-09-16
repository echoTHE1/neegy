export type RoomDTO = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  ownerMemberId: string | null;
  createdAt: string;
};

export type MemberDTO = {
  id: string;
  displayName: string;
  isOwner: boolean;
  joinedAt: string;
};

export type MessageDTO = {
  id: string;
  memberId: string | null;
  authorName: string;
  kind: "user" | "system";
  body: string;
  replyTo: string | null;
  reactions: Record<string, string[]>;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

export type SessionDTO = {
  roomId: string;
  memberId: string;
  token: string;
  displayName: string;
  roomName: string;
};

export type Fail = { ok: false; error: NexusErrorCode };
export type Ok<T> = { ok: true } & T;
export type Result<T> = Ok<T> | Fail;

export type NexusErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_CLOSED"
  | "ROOM_FULL"
  | "NAME_TAKEN"
  | "NOT_A_MEMBER"
  | "REMOVED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "INVALID_INPUT"
  | "MESSAGE_TOO_LONG"
  | "NOT_FOUND"
  | "SERVER_ERROR";

export const ERROR_COPY: Record<NexusErrorCode, { title: string; detail: string }> = {
  ROOM_NOT_FOUND: {
    title: "ROOM NOT FOUND",
    detail: "That NEEGY code doesn't match an active room.",
  },
  ROOM_CLOSED: { title: "ROOM CLOSED", detail: "This NEEGY room is no longer available." },
  ROOM_FULL: { title: "ROOM FULL", detail: "This NEEGY room has reached its member limit." },
  NAME_TAKEN: {
    title: "NAME ALREADY TAKEN",
    detail: "Someone in this room is already using that display name. Try a different one.",
  },
  NOT_A_MEMBER: { title: "ACCESS DENIED", detail: "You're not a member of this room anymore." },
  REMOVED: { title: "REMOVED FROM ROOM", detail: "The room owner removed you from this NEEGY." },
  FORBIDDEN: { title: "NOT ALLOWED", detail: "Only the room owner can do that." },
  RATE_LIMITED: { title: "SLOW DOWN", detail: "You're sending messages too quickly." },
  INVALID_INPUT: { title: "CHECK YOUR DETAILS", detail: "Some of the information isn't valid." },
  MESSAGE_TOO_LONG: { title: "MESSAGE TOO LONG", detail: "Trim it down and try again." },
  NOT_FOUND: { title: "NOT FOUND", detail: "That item no longer exists." },
  SERVER_ERROR: { title: "CONNECTION ERROR", detail: "We couldn't reach the room. Try again." },
};

type ErrorCopy = { title: string; detail: string };

const ERROR_ALIASES: Record<string, NexusErrorCode> = {
  DISPLAY_NAME_TAKEN: "NAME_TAKEN",
  DUPLICATE_NAME: "NAME_TAKEN",
  MEMBER_EXISTS: "NAME_TAKEN",
  MAX_MEMBERS_REACHED: "ROOM_FULL",
  ROOM_AT_CAPACITY: "ROOM_FULL",
  ROOM_INACTIVE: "ROOM_CLOSED",
};

/**
 * Returns useful UI copy even when the server introduces a newer error code.
 * This prevents an unknown server reason from throwing during error rendering
 * and being incorrectly reported as a network failure by the caller.
 */
export function getErrorCopy(error: unknown): ErrorCopy {
  const rawReason =
    typeof error === "string"
      ? error.trim()
      : error && typeof error === "object" && "message" in error
        ? String(error.message).trim()
        : "";
  const reason = rawReason.toUpperCase();
  const code = ERROR_ALIASES[reason] ?? reason;

  if (code && Object.prototype.hasOwnProperty.call(ERROR_COPY, code)) {
    return ERROR_COPY[code as NexusErrorCode];
  }

  if (/^[A-Z][A-Z0-9_]{1,63}$/.test(reason)) {
    const detail = reason
      .toLowerCase()
      .split("_")
      .join(" ")
      .replace(/^./, (letter) => letter.toUpperCase());
    return { title: "COULDN'T JOIN ROOM", detail: `${detail}.` };
  }

  const hasUnsafeCharacter = [...rawReason].some((character) => {
    const codePoint = character.charCodeAt(0);
    return character === "<" || character === ">" || codePoint < 32 || codePoint === 127;
  });
  if (rawReason && rawReason.length <= 160 && !hasUnsafeCharacter) {
    return {
      title: "COULDN'T JOIN ROOM",
      detail: /[.!?]$/.test(rawReason) ? rawReason : `${rawReason}.`,
    };
  }

  return ERROR_COPY.SERVER_ERROR;
}

export const REACTION_SET = ["👍", "❤️", "😂", "🔥", "😮", "🎉"] as const;
