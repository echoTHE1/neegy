import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { LIMITS, generateCode, normalizeCode, sanitizeText } from "./validation";
import type { Fail, MemberDTO, MessageDTO, RoomDTO, Result } from "./types";

// The generated typed client only knows the schema at generation time; these
// tables are only ever reached from this server-only module.
const db = supabaseAdmin as unknown as SupabaseClient;

const MESSAGE_PAGE = 40;
const RATE_WINDOW_MS = 10_000;
const RATE_MAX = 10;

const fail = (error: Fail["error"]): Fail => ({ ok: false, error });

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function newToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toRoom(row: Record<string, unknown>): RoomDTO {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    description: (row['description'] as string) ?? null,
    code: row['code'] as string,
    ownerMemberId: (row['owner_member_id'] as string) ?? null,
    createdAt: row['created_at'] as string,
  };
}

function toMember(row: Record<string, unknown>): MemberDTO {
  return {
    id: row['id'] as string,
    displayName: row['display_name'] as string,
    isOwner: Boolean(row['is_owner']),
    joinedAt: row['joined_at'] as string,
  };
}

function toMessage(row: Record<string, unknown>): MessageDTO {
  return {
    id: row['id'] as string,
    memberId: (row['member_id'] as string) ?? null,
    authorName: row['author_name'] as string,
    kind: (row['kind'] as "user" | "system") ?? "user",
    body: row['deleted_at'] ? "" : (row['body'] as string),
    replyTo: (row['reply_to'] as string) ?? null,
    reactions: (row['reactions'] as Record<string, string[]>) ?? {},
    createdAt: row['created_at'] as string,
    editedAt: (row['edited_at'] as string) ?? null,
    deletedAt: (row['deleted_at'] as string) ?? null,
  };
}

async function systemMessage(roomId: string, body: string) {
  await db.from("messages").insert({
    room_id: roomId,
    kind: "system",
    author_name: "system",
    body,
  });
}

type Auth = { member: Record<string, unknown>; room: Record<string, unknown> };

async function authenticate(roomId: string, token: string): Promise<Auth | Fail> {
  if (!roomId || !token) return fail("NOT_A_MEMBER");
  const tokenHash = await sha256(token);
  const { data: member, error } = await db
    .from("members")
    .select("*")
    .eq("room_id", roomId)
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) return fail("SERVER_ERROR");
  if (!member) return fail("NOT_A_MEMBER");
  if (member['removed']) return fail("REMOVED");

  const { data: room } = await db.from("rooms").select("*").eq("id", roomId).maybeSingle();
  if (!room || !room['active']) return fail("ROOM_CLOSED");
  return { member, room };
}

function isFail(value: unknown): value is Fail {
  return typeof value === "object" && value !== null && (value as Fail).ok === false;
}

async function roster(roomId: string): Promise<MemberDTO[]> {
  const { data } = await db
    .from("members")
    .select("*")
    .eq("room_id", roomId)
    .eq("removed", false)
    .order("joined_at", { ascending: true });
  return (data ?? []).map(toMember);
}

async function recentMessages(roomId: string, before?: string): Promise<MessageDTO[]> {
  let query = db
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_PAGE);
  if (before) query = query.lt("created_at", before);
  const { data } = await query;
  return (data ?? []).map(toMessage).reverse();
}

export async function createRoom(input: {
  displayName: string;
  roomName: string;
  description?: string;
}): Promise<
  Result<{ room: RoomDTO; member: MemberDTO; token: string; members: MemberDTO[] }>
> {
  const displayName = sanitizeText(input.displayName, LIMITS.displayName);
  const roomName = sanitizeText(input.roomName, LIMITS.roomName);
  const description = sanitizeText(input.description ?? "", LIMITS.description) || null;
  if (!displayName || !roomName) return fail("INVALID_INPUT");

  let code = generateCode();
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: clash } = await db.from("rooms").select("id").eq("code", code).maybeSingle();
    if (!clash) break;
    code = generateCode();
  }

  const { data: room, error: roomError } = await db
    .from("rooms")
    .insert({ name: roomName, description, code })
    .select("*")
    .single();
  if (roomError || !room) return fail("SERVER_ERROR");

  const token = newToken();
  const { data: member, error: memberError } = await db
    .from("members")
    .insert({
      room_id: room['id'],
      display_name: displayName,
      token_hash: await sha256(token),
      is_owner: true,
    })
    .select("*")
    .single();
  if (memberError || !member) return fail("SERVER_ERROR");

  await db.from("rooms").update({ owner_member_id: member['id'] }).eq("id", room['id']);
  await systemMessage(room['id'] as string, `${displayName} created this NEXUS`);

  return {
    ok: true,
    room: { ...toRoom(room), ownerMemberId: member['id'] as string },
    member: toMember(member),
    token,
    members: [toMember(member)],
  };
}

export async function joinRoom(input: {
  displayName: string;
  code: string;
}): Promise<Result<{ room: RoomDTO; member: MemberDTO; token: string }>> {
  const displayName = sanitizeText(input.displayName, LIMITS.displayName);
  const code = normalizeCode(input.code);
  if (!displayName) return fail("INVALID_INPUT");
  if (!code) return fail("ROOM_NOT_FOUND");

  const { data: room } = await db.from("rooms").select("*").eq("code", code).maybeSingle();
  if (!room || !room['active']) return fail("ROOM_NOT_FOUND");

  const token = newToken();
  const { data: member, error } = await db
    .from("members")
    .insert({
      room_id: room['id'],
      display_name: displayName,
      token_hash: await sha256(token),
      is_owner: false,
    })
    .select("*")
    .single();
  if (error || !member) return fail("SERVER_ERROR");

  await systemMessage(room['id'] as string, `${displayName} joined the room`);
  return { ok: true, room: toRoom(room), member: toMember(member), token };
}

export async function getRoomState(input: {
  roomId: string;
  token: string;
}): Promise<
  Result<{
    room: RoomDTO;
    me: MemberDTO;
    members: MemberDTO[];
    messages: MessageDTO[];
    hasMore: boolean;
  }>
> {
  const auth = await authenticate(input.roomId, input.token);
  if (isFail(auth)) return auth;
  await db.from("members").update({ last_seen: new Date().toISOString() }).eq("id", auth.member['id']);

  const [members, messages] = await Promise.all([
    roster(input.roomId),
    recentMessages(input.roomId),
  ]);
  return {
    ok: true,
    room: toRoom(auth.room),
    me: toMember(auth.member),
    members,
    messages,
    hasMore: messages.length === MESSAGE_PAGE,
  };
}

export async function loadOlderMessages(input: {
  roomId: string;
  token: string;
  before: string;
}): Promise<Result<{ messages: MessageDTO[]; hasMore: boolean }>> {
  const auth = await authenticate(input.roomId, input.token);
  if (isFail(auth)) return auth;
  const messages = await recentMessages(input.roomId, input.before);
  return { ok: true, messages, hasMore: messages.length === MESSAGE_PAGE };
}

export async function sendMessage(input: {
  roomId: string;
  token: string;
  body: string;
  replyTo?: string | null;
}): Promise<Result<{ message: MessageDTO }>> {
  const auth = await authenticate(input.roomId, input.token);
  if (isFail(auth)) return auth;

  const body = sanitizeText(input.body, LIMITS.message + 1, true);
  if (!body) return fail("INVALID_INPUT");
  if (body.length > LIMITS.message) return fail("MESSAGE_TOO_LONG");

  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count } = await db
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("member_id", auth.member['id'])
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_MAX) return fail("RATE_LIMITED");

  let replyTo: string | null = null;
  if (input.replyTo) {
    const { data: parent } = await db
      .from("messages")
      .select("id")
      .eq("id", input.replyTo)
      .eq("room_id", input.roomId)
      .maybeSingle();
    replyTo = parent ? (parent['id'] as string) : null;
  }

  const { data, error } = await db
    .from("messages")
    .insert({
      room_id: input.roomId,
      member_id: auth.member['id'],
      author_name: auth.member['display_name'],
      kind: "user",
      body,
      reply_to: replyTo,
    })
    .select("*")
    .single();
  if (error || !data) return fail("SERVER_ERROR");
  return { ok: true, message: toMessage(data) };
}

export async function editMessage(input: {
  roomId: string;
  token: string;
  messageId: string;
  body: string;
}): Promise<Result<{ message: MessageDTO }>> {
  const auth = await authenticate(input.roomId, input.token);
  if (isFail(auth)) return auth;
  const body = sanitizeText(input.body, LIMITS.message + 1, true);
  if (!body) return fail("INVALID_INPUT");
  if (body.length > LIMITS.message) return fail("MESSAGE_TOO_LONG");

  const { data: existing } = await db
    .from("messages")
    .select("*")
    .eq("id", input.messageId)
    .eq("room_id", input.roomId)
    .maybeSingle();
  if (!existing || existing['deleted_at']) return fail("NOT_FOUND");
  if (existing['member_id'] !== auth.member['id'] || existing['kind'] !== "user")
    return fail("FORBIDDEN");

  const { data, error } = await db
    .from("messages")
    .update({ body, edited_at: new Date().toISOString() })
    .eq("id", input.messageId)
    .select("*")
    .single();
  if (error || !data) return fail("SERVER_ERROR");
  return { ok: true, message: toMessage(data) };
}

export async function deleteMessage(input: {
  roomId: string;
  token: string;
  messageId: string;
}): Promise<Result<{ message: MessageDTO }>> {
  const auth = await authenticate(input.roomId, input.token);
  if (isFail(auth)) return auth;

  const { data: existing } = await db
    .from("messages")
    .select("*")
    .eq("id", input.messageId)
    .eq("room_id", input.roomId)
    .maybeSingle();
  if (!existing) return fail("NOT_FOUND");
  const isOwner = auth.member['is_owner'] === true;
  if (existing['member_id'] !== auth.member['id'] && !isOwner) return fail("FORBIDDEN");

  const { data, error } = await db
    .from("messages")
    .update({ deleted_at: new Date().toISOString(), body: "" })
    .eq("id", input.messageId)
    .select("*")
    .single();
  if (error || !data) return fail("SERVER_ERROR");
  return { ok: true, message: toMessage(data) };
}

export async function toggleReaction(input: {
  roomId: string;
  token: string;
  messageId: string;
  emoji: string;
}): Promise<Result<{ message: MessageDTO }>> {
  const auth = await authenticate(input.roomId, input.token);
  if (isFail(auth)) return auth;

  const { data: existing } = await db
    .from("messages")
    .select("*")
    .eq("id", input.messageId)
    .eq("room_id", input.roomId)
    .maybeSingle();
  if (!existing || existing['deleted_at']) return fail("NOT_FOUND");

  const reactions = { ...((existing['reactions'] as Record<string, string[]>) ?? {}) };
  const memberId = auth.member['id'] as string;
  const current = reactions[input.emoji] ?? [];
  reactions[input.emoji] = current.includes(memberId)
    ? current.filter((id) => id !== memberId)
    : [...current, memberId];
  if (reactions[input.emoji]!.length === 0) delete reactions[input.emoji];

  const { data, error } = await db
    .from("messages")
    .update({ reactions })
    .eq("id", input.messageId)
    .select("*")
    .single();
  if (error || !data) return fail("SERVER_ERROR");
  return { ok: true, message: toMessage(data) };
}

export async function pingRoom(input: {
  roomId: string;
  token: string;
}): Promise<Result<{ room: RoomDTO; members: MemberDTO[] }>> {
  const auth = await authenticate(input.roomId, input.token);
  if (isFail(auth)) return auth;
  await db.from("members").update({ last_seen: new Date().toISOString() }).eq("id", auth.member['id']);
  return { ok: true, room: toRoom(auth.room), members: await roster(input.roomId) };
}

export async function leaveRoom(input: {
  roomId: string;
  token: string;
}): Promise<Result<Record<string, never>>> {
  const auth = await authenticate(input.roomId, input.token);
  if (isFail(auth)) return { ok: true } as Result<Record<string, never>>;

  const memberId = auth.member['id'] as string;
  const name = auth.member['display_name'] as string;
  await db.from("members").update({ removed: true }).eq("id", memberId);
  await systemMessage(input.roomId, `${name} left the room`);

  if (auth.member['is_owner']) {
    const remaining = await roster(input.roomId);
    const heir = remaining[0];
    if (heir) {
      await db.from("members").update({ is_owner: true }).eq("id", heir.id);
      await db.from("rooms").update({ owner_member_id: heir.id }).eq("id", input.roomId);
      await systemMessage(input.roomId, `${heir.displayName} is now the room owner`);
    } else {
      await db.from("rooms").update({ active: false }).eq("id", input.roomId);
    }
  }
  return { ok: true } as Result<Record<string, never>>;
}

async function requireOwner(roomId: string, token: string): Promise<Auth | Fail> {
  const auth = await authenticate(roomId, token);
  if (isFail(auth)) return auth;
  if (!auth.member['is_owner']) return fail("FORBIDDEN");
  return auth;
}

export async function updateRoom(input: {
  roomId: string;
  token: string;
  name: string;
  description?: string;
}): Promise<Result<{ room: RoomDTO }>> {
  const auth = await requireOwner(input.roomId, input.token);
  if (isFail(auth)) return auth;
  const name = sanitizeText(input.name, LIMITS.roomName);
  const description = sanitizeText(input.description ?? "", LIMITS.description) || null;
  if (!name) return fail("INVALID_INPUT");

  const { data, error } = await db
    .from("rooms")
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq("id", input.roomId)
    .select("*")
    .single();
  if (error || !data) return fail("SERVER_ERROR");
  await systemMessage(input.roomId, `Room renamed to ${name}`);
  return { ok: true, room: toRoom(data) };
}

export async function regenerateCode(input: {
  roomId: string;
  token: string;
}): Promise<Result<{ room: RoomDTO }>> {
  const auth = await requireOwner(input.roomId, input.token);
  if (isFail(auth)) return auth;

  let code = generateCode();
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: clash } = await db.from("rooms").select("id").eq("code", code).maybeSingle();
    if (!clash) break;
    code = generateCode();
  }
  const { data, error } = await db
    .from("rooms")
    .update({ code, updated_at: new Date().toISOString() })
    .eq("id", input.roomId)
    .select("*")
    .single();
  if (error || !data) return fail("SERVER_ERROR");
  await systemMessage(input.roomId, "Room invite code regenerated");
  return { ok: true, room: toRoom(data) };
}

export async function removeMember(input: {
  roomId: string;
  token: string;
  memberId: string;
}): Promise<Result<{ members: MemberDTO[] }>> {
  const auth = await requireOwner(input.roomId, input.token);
  if (isFail(auth)) return auth;
  if (input.memberId === auth.member['id']) return fail("FORBIDDEN");

  const { data: target } = await db
    .from("members")
    .select("*")
    .eq("id", input.memberId)
    .eq("room_id", input.roomId)
    .maybeSingle();
  if (!target) return fail("NOT_FOUND");

  await db.from("members").update({ removed: true }).eq("id", input.memberId);
  await systemMessage(input.roomId, `${target['display_name']} was removed from the room`);
  return { ok: true, members: await roster(input.roomId) };
}

export async function clearMessages(input: {
  roomId: string;
  token: string;
}): Promise<Result<Record<string, never>>> {
  const auth = await requireOwner(input.roomId, input.token);
  if (isFail(auth)) return auth;
  await db.from("messages").delete().eq("room_id", input.roomId);
  await systemMessage(input.roomId, "The owner cleared the message history");
  return { ok: true } as Result<Record<string, never>>;
}

export async function deleteRoom(input: {
  roomId: string;
  token: string;
}): Promise<Result<Record<string, never>>> {
  const auth = await requireOwner(input.roomId, input.token);
  if (isFail(auth)) return auth;
  await db.from("rooms").delete().eq("id", input.roomId);
  return { ok: true } as Result<Record<string, never>>;
}
