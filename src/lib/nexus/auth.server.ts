import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { LIMITS, sanitizeText } from "./validation";
import type { Fail, Result } from "./types";

const db = supabaseAdmin as unknown as SupabaseClient;

const fail = (error: Fail["error"]): Fail => ({ ok: false, error });

export type UserDTO = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  lastSeen: string;
};

export type UserSessionDTO = {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string | null;
  authToken: string;
};

export type RoomMembershipDTO = {
  id: string;
  roomId: string;
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
};

function toUser(row: Record<string, unknown>): UserDTO {
  return {
    id: row["id"] as string,
    username: row["username"] as string,
    displayName: row["display_name"] as string,
    email: row["email"] as string,
    avatar: (row["avatar"] as string | null) ?? null,
    createdAt: row["created_at"] as string,
    lastSeen: row["last_seen"] as string,
  };
}

function toUserSession(user: UserDTO, authToken: string): UserSessionDTO {
  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatar: user.avatar,
    authToken,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function getUserByEmail(email: string): Promise<Record<string, unknown> | null> {
  const { data } = await db
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return data ?? null;
}

async function getUserByUsername(username: string): Promise<Record<string, unknown> | null> {
  const { data } = await db
    .from("users")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data ?? null;
}

async function authenticateUser(userId: string, token: string): Promise<Record<string, unknown> | Fail> {
  if (!userId || !token) return fail("NOT_A_MEMBER");

  const { data: user, error } = await db
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("auth_token", token)
    .maybeSingle();

  if (error) return fail("SERVER_ERROR");
  if (!user) return fail("NOT_A_MEMBER");
  return user;
}

function isFail(value: unknown): value is Fail {
  return typeof value === "object" && value !== null && (value as Fail).ok === false;
}

export async function registerUser(input: {
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
}): Promise<Result<{ user: UserDTO; authToken: string }>> {
  const username = sanitizeText(input.username, 30).toLowerCase();
  const displayName = sanitizeText(input.displayName, LIMITS.displayName);
  const email = input.email.toLowerCase().trim();

  if (!username || !displayName || !email) return fail("INVALID_INPUT");
  if (!isValidEmail(email)) return fail("INVALID_INPUT");
  if (username.length < 3) return fail("INVALID_INPUT");

  // Check username uniqueness
  const existingUsername = await getUserByUsername(username);
  if (existingUsername) return fail("INVALID_INPUT");

  // Check email uniqueness
  const existingEmail = await getUserByEmail(email);
  if (existingEmail) return fail("INVALID_INPUT");

  const authToken = generateToken();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("users")
    .insert({
      username,
      display_name: displayName,
      email,
      password_hash: input.passwordHash,
      auth_token: authToken,
      created_at: now,
      last_seen: now,
    })
    .select("*")
    .single();

  if (error || !data) return fail("SERVER_ERROR");
  return { ok: true, user: toUser(data), authToken };
}

export async function loginUser(input: {
  email: string;
  passwordHash: string;
}): Promise<Result<{ user: UserDTO; authToken: string }>> {
  const email = input.email.toLowerCase().trim();

  if (!email) return fail("INVALID_INPUT");
  if (!isValidEmail(email)) return fail("INVALID_INPUT");

  const user = await getUserByEmail(email);
  if (!user) return fail("NOT_A_MEMBER");

  // In a real system, you'd use bcrypt or similar to verify the password hash
  // For now, we compare the provided hash with stored hash
  if (user["password_hash"] !== input.passwordHash) return fail("FORBIDDEN");

  const authToken = generateToken();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("users")
    .update({ auth_token: authToken, last_seen: now })
    .eq("id", user["id"])
    .select("*")
    .single();

  if (error || !data) return fail("SERVER_ERROR");
  return { ok: true, user: toUser(data), authToken };
}

export async function getUserProfile(input: {
  userId: string;
  token: string;
}): Promise<Result<{ user: UserDTO }>> {
  const user = await authenticateUser(input.userId, input.token);
  if (isFail(user)) return user;

  await db.from("users").update({ last_seen: new Date().toISOString() }).eq("id", input.userId);

  return { ok: true, user: toUser(user) };
}

export async function updateUserProfile(input: {
  userId: string;
  token: string;
  displayName?: string;
  avatar?: string | null;
}): Promise<Result<{ user: UserDTO }>> {
  const user = await authenticateUser(input.userId, input.token);
  if (isFail(user)) return user;

  const updates: Record<string, unknown> = {
    last_seen: new Date().toISOString(),
  };

  if (input.displayName !== undefined) {
    const displayName = sanitizeText(input.displayName, LIMITS.displayName);
    if (!displayName) return fail("INVALID_INPUT");
    updates['display_name'] = displayName;
  }

  if (input.avatar !== undefined) {
    updates['avatar'] = input.avatar;
  }

  const { data, error } = await db
    .from("users")
    .update(updates)
    .eq("id", input.userId)
    .select("*")
    .single();

  if (error || !data) return fail("SERVER_ERROR");
  return { ok: true, user: toUser(data) };
}

export async function logoutUser(input: {
  userId: string;
  token: string;
}): Promise<Result<Record<string, never>>> {
  const user = await authenticateUser(input.userId, input.token);
  if (isFail(user)) return user;

  const { error } = await db.from("users").update({ auth_token: null }).eq("id", input.userId);

  if (error) return fail("SERVER_ERROR");
  return { ok: true } as Result<Record<string, never>>;
}

export async function deleteUserAccount(input: {
  userId: string;
  token: string;
}): Promise<Result<Record<string, never>>> {
  const user = await authenticateUser(input.userId, input.token);
  if (isFail(user)) return user;

  // Delete all user's rooms (cascade will handle related data)
  await db.from("rooms").delete().eq("owner_member_id", input.userId);

  // Delete user
  const { error } = await db.from("users").delete().eq("id", input.userId);

  if (error) return fail("SERVER_ERROR");
  return { ok: true } as Result<Record<string, never>>;
}

export async function getUserRooms(input: {
  userId: string;
  token: string;
}): Promise<Result<{ rooms: Array<Record<string, unknown>> }>> {
  const user = await authenticateUser(input.userId, input.token);
  if (isFail(user)) return user;

  const { data: rooms, error } = await db
    .from("room_members")
    .select("room_id")
    .eq("user_id", input.userId)
    .eq("active", true);

  if (error) return fail("SERVER_ERROR");

  const roomIds = (rooms ?? []).map((r) => r.room_id as string);
  if (roomIds.length === 0) {
    return { ok: true, rooms: [] };
  }

  const { data: roomData } = await db
    .from("rooms")
    .select("*")
    .in("id", roomIds)
    .eq("active", true);

  return { ok: true, rooms: roomData ?? [] };
}

export async function verifyUserSession(userId: string, token: string): Promise<UserDTO | Fail> {
  const user = await authenticateUser(userId, token);
  if (isFail(user)) return user;
  return toUser(user);
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
