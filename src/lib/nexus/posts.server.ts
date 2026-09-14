import type { SupabaseClient } from "@supabase/supabase-js";

import { sanitizeText } from "./validation";

export const POST_CATEGORIES = [
  "WEBSITES",
  "PROJECTS",
  "GAMES",
  "TOOLS",
  "UPDATES",
  "RESOURCES",
  "OTHER",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export type PostDTO = {
  id: string;
  title: string;
  content: string;
  url: string | null;
  category: string;
  pinned: boolean;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PostResult<T> = ({ ok: true } & T) | { ok: false; error: string };

const failed = (error: string): { ok: false; error: string } => ({ ok: false, error });

async function db(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

function toPost(row: Record<string, unknown>): PostDTO {
  return {
    id: row["id"] as string,
    title: row["title"] as string,
    content: (row["content"] as string) ?? "",
    url: (row["url"] as string | null) ?? null,
    category: (row["category"] as string) ?? "OTHER",
    pinned: Boolean(row["pinned"]),
    published: Boolean(row["published"]),
    displayOrder: (row["display_order"] as number) ?? 0,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string,
  };
}

/* ---------- owner session (HMAC token, password never leaves the server) ---------- */

const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(payload: string): Promise<string> {
  const secret = process.env["OWNER_SESSION_SECRET"];
  if (!secret) throw new Error("OWNER_SESSION_SECRET is not configured");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToHex(new Uint8Array(sig));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function issueOwnerToken(): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `owner.${expiresAt}`;
  return { token: `${payload}.${await hmac(payload)}`, expiresAt };
}

async function verifyOwnerToken(token: string): Promise<boolean> {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 3) return false;
  const [scope, expRaw, signature] = parts as [string, string, string];
  if (scope !== "owner") return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return constantTimeEqual(await hmac(`owner.${expRaw}`), signature);
}

export async function ownerUnlock(password: string): Promise<PostResult<{ token: string; expiresAt: number }>> {
  const expected = process.env["NEEGY_OWNER_PASSWORD"];
  if (!expected) return failed("NOT_CONFIGURED");
  const given = String(password ?? "");
  const [a, b] = await Promise.all([hmac(`pw.${given}`), hmac(`pw.${expected}`)]);
  // brief delay to blunt rapid guessing
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (!constantTimeEqual(a, b)) return failed("INVALID_PASSWORD");
  const session = await issueOwnerToken();
  return { ok: true, ...session };
}

export async function ownerCheck(token: string): Promise<PostResult<Record<string, never>>> {
  if (!(await verifyOwnerToken(token))) return failed("UNAUTHORIZED");
  return { ok: true } as PostResult<Record<string, never>>;
}

/* ---------- validation ---------- */

function normalizeUrl(raw: string | null | undefined): string | null | "INVALID" {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    try {
      parsed = new URL(`https://${value}`);
    } catch {
      return "INVALID";
    }
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "INVALID";
  return parsed.toString();
}

function normalizeCategory(raw: string | undefined): PostCategory {
  const value = String(raw ?? "").trim().toUpperCase();
  return (POST_CATEGORIES as readonly string[]).includes(value) ? (value as PostCategory) : "OTHER";
}

/* ---------- public reads ---------- */

export async function listPublicPosts(): Promise<PostResult<{ posts: PostDTO[] }>> {
  const client = await db();
  const { data, error } = await client
    .from("owner_posts")
    .select("*")
    .eq("published", true)
    .order("pinned", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return failed("SERVER_ERROR");
  return { ok: true, posts: (data ?? []).map(toPost) };
}

export async function listAllPosts(token: string): Promise<PostResult<{ posts: PostDTO[] }>> {
  if (!(await verifyOwnerToken(token))) return failed("UNAUTHORIZED");
  const client = await db();
  const { data, error } = await client
    .from("owner_posts")
    .select("*")
    .order("pinned", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return failed("SERVER_ERROR");
  return { ok: true, posts: (data ?? []).map(toPost) };
}

/* ---------- owner writes ---------- */

export async function createPost(input: {
  token: string;
  title: string;
  content: string;
  url?: string | null | undefined;
  category?: string | undefined;
  pinned?: boolean | undefined;
}): Promise<PostResult<{ post: PostDTO }>> {
  if (!(await verifyOwnerToken(input.token))) return failed("UNAUTHORIZED");

  const title = sanitizeText(input.title, 120);
  const content = sanitizeText(input.content ?? "", 2000, true);
  const url = normalizeUrl(input.url);
  if (!title) return failed("INVALID_INPUT");
  if (url === "INVALID") return failed("INVALID_URL");
  if (!content && !url) return failed("INVALID_INPUT");

  const client = await db();
  const { data: top } = await client
    .from("owner_posts")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  const displayOrder = ((top?.[0]?.["display_order"] as number | undefined) ?? 0) + 1;

  const { data, error } = await client
    .from("owner_posts")
    .insert({
      title,
      content,
      url,
      category: normalizeCategory(input.category),
      pinned: Boolean(input.pinned),
      published: true,
      display_order: displayOrder,
    })
    .select("*")
    .single();

  if (error || !data) return failed("SERVER_ERROR");
  return { ok: true, post: toPost(data) };
}

export async function updatePost(input: {
  token: string;
  postId: string;
  title?: string | undefined;
  content?: string | undefined;
  url?: string | null | undefined;
  category?: string | undefined;
  pinned?: boolean | undefined;
  published?: boolean | undefined;
}): Promise<PostResult<{ post: PostDTO }>> {
  if (!(await verifyOwnerToken(input.token))) return failed("UNAUTHORIZED");

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) {
    const title = sanitizeText(input.title, 120);
    if (!title) return failed("INVALID_INPUT");
    updates["title"] = title;
  }
  if (input.content !== undefined) updates["content"] = sanitizeText(input.content, 2000, true);
  if (input.url !== undefined) {
    const url = normalizeUrl(input.url);
    if (url === "INVALID") return failed("INVALID_URL");
    updates["url"] = url;
  }
  if (input.category !== undefined) updates["category"] = normalizeCategory(input.category);
  if (input.pinned !== undefined) updates["pinned"] = Boolean(input.pinned);
  if (input.published !== undefined) updates["published"] = Boolean(input.published);

  const client = await db();
  const { data, error } = await client
    .from("owner_posts")
    .update(updates)
    .eq("id", input.postId)
    .select("*")
    .maybeSingle();

  if (error) return failed("SERVER_ERROR");
  if (!data) return failed("NOT_FOUND");
  return { ok: true, post: toPost(data) };
}

export async function deletePost(input: {
  token: string;
  postId: string;
}): Promise<PostResult<Record<string, never>>> {
  if (!(await verifyOwnerToken(input.token))) return failed("UNAUTHORIZED");
  const client = await db();
  const { error } = await client.from("owner_posts").delete().eq("id", input.postId);
  if (error) return failed("SERVER_ERROR");
  return { ok: true } as PostResult<Record<string, never>>;
}

export async function reorderPosts(input: {
  token: string;
  postIds: string[];
}): Promise<PostResult<{ posts: PostDTO[] }>> {
  if (!(await verifyOwnerToken(input.token))) return failed("UNAUTHORIZED");
  const client = await db();
  await Promise.all(
    input.postIds.map((id, index) =>
      client.from("owner_posts").update({ display_order: index }).eq("id", id),
    ),
  );
  return listAllPosts(input.token);
}
