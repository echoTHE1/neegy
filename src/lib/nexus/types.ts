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
    detail: "That NEXUS code doesn't match an active room.",
  },
  ROOM_CLOSED: { title: "ROOM CLOSED", detail: "This NEXUS room is no longer available." },
  NOT_A_MEMBER: { title: "ACCESS DENIED", detail: "You're not a member of this room anymore." },
  REMOVED: { title: "REMOVED FROM ROOM", detail: "The room owner removed you from this NEXUS." },
  FORBIDDEN: { title: "NOT ALLOWED", detail: "Only the room owner can do that." },
  RATE_LIMITED: { title: "SLOW DOWN", detail: "You're sending messages too quickly." },
  INVALID_INPUT: { title: "CHECK YOUR DETAILS", detail: "Some of the information isn't valid." },
  MESSAGE_TOO_LONG: { title: "MESSAGE TOO LONG", detail: "Trim it down and try again." },
  NOT_FOUND: { title: "NOT FOUND", detail: "That item no longer exists." },
  SERVER_ERROR: { title: "CONNECTION ERROR", detail: "We couldn't reach the room. Try again." },
};

export const REACTION_SET = ["👍", "❤️", "😂", "🔥", "😮", "🎉"] as const;
