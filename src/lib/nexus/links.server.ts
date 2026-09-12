import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { LIMITS, sanitizeText } from "./validation";
import type { Fail, Result } from "./types";

const db = supabaseAdmin as unknown as SupabaseClient;

const fail = (error: Fail["error"]): Fail => ({ ok: false, error });

export type LinkDTO = {
  id: string;
  roomId: string;
  title: string;
  url: string;
  description: string;
  category: string;
  icon: string | null;
  pinned: boolean;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

function toLink(row: Record<string, unknown>): LinkDTO {
  return {
    id: row["id"] as string,
    roomId: row["room_id"] as string,
    title: row["title"] as string,
    url: row["url"] as string,
    description: row["description"] as string,
    category: row["category"] as string,
    icon: (row["icon"] as string | null) ?? null,
    pinned: Boolean(row["pinned"]),
    published: Boolean(row["published"]),
    displayOrder: row["display_order"] as number,
    createdAt: row["created_at"] as string,
    updatedAt: row["updated_at"] as string,
  };
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

type Auth = { member: Record<string, unknown>; room: Record<string, unknown> };

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function authenticateAsOwner(roomId: string, token: string): Promise<Auth | Fail> {
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
  if (!member["is_owner"]) return fail("FORBIDDEN");
  if (member["removed"]) return fail("REMOVED");

  const { data: room } = await db.from("rooms").select("*").eq("id", roomId).maybeSingle();
  if (!room || !room["active"]) return fail("ROOM_CLOSED");
  return { member, room };
}

function isFail(value: unknown): value is Fail {
  return typeof value === "object" && value !== null && (value as Fail).ok === false;
}

export async function getChannelLinks(input: {
  roomId: string;
  token: string;
}): Promise<Result<{ links: LinkDTO[] }>> {
  if (!input.roomId || !input.token) return fail("INVALID_INPUT");

  const { data: links, error } = await db
    .from("channel_links")
    .select("*")
    .eq("room_id", input.roomId)
    .eq("published", true)
    .order("pinned", { ascending: false })
    .order("display_order", { ascending: true });

  if (error) return fail("SERVER_ERROR");
  return { ok: true, links: (links ?? []).map(toLink) };
}

export async function addLink(input: {
  roomId: string;
  token: string;
  title: string;
  url: string;
  description: string;
  category: string;
  icon?: string | null;
  pinned?: boolean;
}): Promise<Result<{ link: LinkDTO }>> {
  const auth = await authenticateAsOwner(input.roomId, input.token);
  if (isFail(auth)) return auth;

  const title = sanitizeText(input.title, 100);
  const description = sanitizeText(input.description, 500);
  const category = sanitizeText(input.category, 50);

  if (!title) return fail("INVALID_INPUT");
  if (!isValidUrl(input.url)) return fail("INVALID_INPUT");

  const { data: maxOrder } = await db
    .from("channel_links")
    .select("display_order")
    .eq("room_id", input.roomId)
    .order("display_order", { ascending: false })
    .limit(1);

  const displayOrder = ((maxOrder?.[0]?.display_order as number) ?? 0) + 1;

  const { data, error } = await db
    .from("channel_links")
    .insert({
      room_id: input.roomId,
      title,
      url: input.url,
      description,
      category,
      icon: input.icon ?? null,
      pinned: input.pinned ?? false,
      published: true,
      display_order: displayOrder,
    })
    .select("*")
    .single();

  if (error || !data) return fail("SERVER_ERROR");
  return { ok: true, link: toLink(data) };
}

export async function updateLink(input: {
  roomId: string;
  token: string;
  linkId: string;
  title?: string;
  url?: string;
  description?: string;
  category?: string;
  icon?: string | null;
  pinned?: boolean;
  published?: boolean;
}): Promise<Result<{ link: LinkDTO }>> {
  const auth = await authenticateAsOwner(input.roomId, input.token);
  if (isFail(auth)) return auth;

  const { data: existing } = await db
    .from("channel_links")
    .select("*")
    .eq("id", input.linkId)
    .eq("room_id", input.roomId)
    .maybeSingle();

  if (!existing) return fail("NOT_FOUND");

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    const title = sanitizeText(input.title, 100);
    if (!title) return fail("INVALID_INPUT");
    updates.title = title;
  }

  if (input.url !== undefined) {
    if (!isValidUrl(input.url)) return fail("INVALID_INPUT");
    updates.url = input.url;
  }

  if (input.description !== undefined) {
    updates.description = sanitizeText(input.description, 500);
  }

  if (input.category !== undefined) {
    updates.category = sanitizeText(input.category, 50);
  }

  if (input.icon !== undefined) {
    updates.icon = input.icon;
  }

  if (input.pinned !== undefined) {
    updates.pinned = input.pinned;
  }

  if (input.published !== undefined) {
    updates.published = input.published;
  }

  const { data, error } = await db
    .from("channel_links")
    .update(updates)
    .eq("id", input.linkId)
    .select("*")
    .single();

  if (error || !data) return fail("SERVER_ERROR");
  return { ok: true, link: toLink(data) };
}

export async function deleteLink(input: {
  roomId: string;
  token: string;
  linkId: string;
}): Promise<Result<Record<string, never>>> {
  const auth = await authenticateAsOwner(input.roomId, input.token);
  if (isFail(auth)) return auth;

  const { data: existing } = await db
    .from("channel_links")
    .select("*")
    .eq("id", input.linkId)
    .eq("room_id", input.roomId)
    .maybeSingle();

  if (!existing) return fail("NOT_FOUND");

  const { error } = await db.from("channel_links").delete().eq("id", input.linkId);

  if (error) return fail("SERVER_ERROR");
  return { ok: true } as Result<Record<string, never>>;
}

export async function reorderLinks(input: {
  roomId: string;
  token: string;
  linkIds: string[];
}): Promise<Result<{ links: LinkDTO[] }>> {
  const auth = await authenticateAsOwner(input.roomId, input.token);
  if (isFail(auth)) return auth;

  const updates = input.linkIds.map((id, index) => ({
    id,
    display_order: index,
  }));

  for (const update of updates) {
    await db
      .from("channel_links")
      .update({ display_order: update.display_order })
      .eq("id", update.id);
  }

  const { data, error } = await db
    .from("channel_links")
    .select("*")
    .eq("room_id", input.roomId)
    .eq("published", true)
    .order("pinned", { ascending: false })
    .order("display_order", { ascending: true });

  if (error) return fail("SERVER_ERROR");
  return { ok: true, links: (data ?? []).map(toLink) };
}
