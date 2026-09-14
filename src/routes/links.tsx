import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Link2,
  MoreVertical,
  MoveDown,
  MoveUp,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BackgroundFX } from "@/components/nexus/BackgroundFX";
import { Modal } from "@/components/nexus/Modal";
import { NexusLockup } from "@/components/nexus/NexusLogo";
import { Button, Field, GlassCard, HudTag, Skeleton, TextArea, TextInput } from "@/components/nexus/primitives";
import { notify } from "@/components/nexus/toast";
import { supabase } from "@/integrations/supabase/client";
import {
  createPostFn,
  deletePostFn,
  listAllPostsFn,
  listPublicPostsFn,
  ownerCheckFn,
  ownerUnlockFn,
  reorderPostsFn,
  updatePostFn,
} from "@/lib/posts.functions";
import type { PostDTO } from "@/lib/nexus/posts.server";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "WEBSITES",
  "PROJECTS",
  "GAMES",
  "TOOLS",
  "UPDATES",
  "RESOURCES",
  "OTHER",
] as const;

const OWNER_TOKEN_KEY = "neegy_owner_token";
const LINKS_CHANNEL = "neegy-links";

export const Route = createFileRoute("/links")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NEEGY Links — Updates, Projects & Resources" },
      {
        name: "description",
        content:
          "Official NEEGY links and updates. Browse, search and copy curated websites, projects, games, tools and resources — all in one public feed.",
      },
      { property: "og:title", content: "NEEGY Links — Updates, Projects & Resources" },
      {
        property: "og:description",
        content: "Curated NEEGY links and announcements. Search, copy and open every link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LinksPage,
});

type Draft = {
  title: string;
  content: string;
  url: string;
  category: string;
  pinned: boolean;
};

const EMPTY_DRAFT: Draft = { title: "", content: "", url: "", category: "OTHER", pinned: false };

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (diff < day && new Date(iso).getDate() === new Date().getDate()) return "Posted today";
  const days = Math.floor(diff / day);
  if (days <= 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${new Date(iso).toLocaleDateString()}`;
}

function LinksPage() {
  const [posts, setPosts] = useState<PostDTO[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("ALL");

  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PostDTO | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PostDTO | null>(null);

  const isOwner = Boolean(ownerToken);

  const load = useCallback(
    async (token?: string | null) => {
      const result = token
        ? await listAllPostsFn({ data: { token } })
        : await listPublicPostsFn();
      if (!result.ok) {
        if (token) {
          localStorage.removeItem(OWNER_TOKEN_KEY);
          setOwnerToken(null);
          const fallback = await listPublicPostsFn();
          if (fallback.ok) setPosts(fallback.posts);
        }
        return;
      }
      setPosts(result.posts);
    },
    [],
  );

  /* initial load + restore owner session */
  useEffect(() => {
    const stored = localStorage.getItem(OWNER_TOKEN_KEY);
    if (!stored) {
      void load(null);
      return;
    }
    void (async () => {
      const check = await ownerCheckFn({ data: { token: stored } });
      if (check.ok) {
        setOwnerToken(stored);
        await load(stored);
      } else {
        localStorage.removeItem(OWNER_TOKEN_KEY);
        await load(null);
      }
    })();
  }, [load]);

  /* realtime: any owner change refreshes every open page */
  useEffect(() => {
    const channel = supabase
      .channel(LINKS_CHANNEL)
      .on("broadcast", { event: "links-changed" }, () => {
        void load(localStorage.getItem(OWNER_TOKEN_KEY));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const announce = useCallback(() => {
    void supabase.channel(LINKS_CHANNEL).send({
      type: "broadcast",
      event: "links-changed",
      payload: {},
    });
  }, []);

  const visible = useMemo(() => {
    const list = posts ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((post) => {
      if (category !== "ALL" && post.category !== category) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        (post.url ?? "").toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q)
      );
    });
  }, [posts, query, category]);

  const pinned = visible.filter((p) => p.pinned);
  const rest = visible.filter((p) => !p.pinned);

  const handleUnlock = async () => {
    setUnlocking(true);
    setUnlockError(null);
    const result = await ownerUnlockFn({ data: { password } });
    setUnlocking(false);
    if (!result.ok) {
      setUnlockError(
        result.error === "NOT_CONFIGURED"
          ? "Owner access is not configured yet."
          : "Incorrect password.",
      );
      return;
    }
    localStorage.setItem(OWNER_TOKEN_KEY, result.token);
    setOwnerToken(result.token);
    setPassword("");
    setUnlockOpen(false);
    notify.success("Owner mode unlocked");
    await load(result.token);
  };

  const lock = () => {
    localStorage.removeItem(OWNER_TOKEN_KEY);
    setOwnerToken(null);
    void load(null);
    notify.info("Owner mode locked");
  };

  const submitDraft = async () => {
    if (!ownerToken) return;
    setSaving(true);
    const payload = {
      token: ownerToken,
      title: draft.title,
      content: draft.content,
      url: draft.url.trim() ? draft.url.trim() : null,
      category: draft.category,
      pinned: draft.pinned,
    };
    const result = editing
      ? await updatePostFn({ data: { ...payload, postId: editing.id } })
      : await createPostFn({ data: payload });
    setSaving(false);
    if (!result.ok) {
      notify.error(
        result.error === "INVALID_URL" ? "That link isn't a valid http(s) URL" : "Check the title and content",
      );
      return;
    }
    notify.success(editing ? "✓ Post updated" : "✓ Post published");
    setComposerOpen(false);
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    await load(ownerToken);
    announce();
  };

  const patch = async (post: PostDTO, changes: Partial<Pick<PostDTO, "pinned" | "published">>) => {
    if (!ownerToken) return;
    const result = await updatePostFn({ data: { token: ownerToken, postId: post.id, ...changes } });
    if (!result.ok) return notify.error("Could not update the post");
    await load(ownerToken);
    announce();
  };

  const move = async (post: PostDTO, direction: -1 | 1) => {
    if (!ownerToken || !posts) return;
    const group = posts.filter((p) => p.pinned === post.pinned);
    const index = group.findIndex((p) => p.id === post.id);
    const target = index + direction;
    if (target < 0 || target >= group.length) return;
    const reordered = [...group];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved!);
    const result = await reorderPostsFn({
      data: { token: ownerToken, postIds: reordered.map((p) => p.id) },
    });
    if (!result.ok) return notify.error("Could not reorder");
    await load(ownerToken);
    announce();
  };

  const confirmDelete = async () => {
    if (!ownerToken || !pendingDelete) return;
    const result = await deletePostFn({ data: { token: ownerToken, postId: pendingDelete.id } });
    setPendingDelete(null);
    if (!result.ok) return notify.error("Could not delete the post");
    notify.success("✓ Post deleted");
    await load(ownerToken);
    announce();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundFX />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-6">
        <Link to="/" className="flex items-center gap-3">
          <NexusLockup />
        </Link>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <>
              <HudTag className="hidden rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-primary sm:flex">
                <ShieldCheck className="h-3 w-3" /> Owner mode
              </HudTag>
              <Button size="sm" variant="ghost" onClick={lock}>
                Lock
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setUnlockOpen(true)}>
              Owner mode
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-24">
        <Link
          to="/"
          className="hud-label inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back home
        </Link>

        <h1 className="mt-5 font-display text-[clamp(2rem,7vw,3.2rem)] leading-none font-black tracking-[0.06em] uppercase">
          <span className="text-gradient">NEEGY Links</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Official links, projects and updates. Everything here is public — search it, copy it, open
          it.
        </p>

        {/* search + filters */}
        <div className="mt-8 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search NEEGY links..."
              aria-label="Search NEEGY links"
              className="pl-11"
            />
          </div>
          <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
            {["ALL", ...CATEGORIES].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  "font-display shrink-0 rounded-full border px-3.5 py-1.5 text-[10px] tracking-[0.18em] uppercase transition-all",
                  category === item
                    ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_22px_-10px_var(--primary-glow)]"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {isOwner && (
          <Button
            className="mt-6 w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setDraft(EMPTY_DRAFT);
              setComposerOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Create new post
          </Button>
        )}

        {/* list */}
        <section className="mt-8 space-y-8">
          {posts === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Link2 className="mx-auto h-6 w-6 text-primary" aria-hidden />
              <p className="mt-3 text-sm text-muted-foreground">
                {posts.length === 0
                  ? "No links have been posted yet."
                  : "Nothing matches that search."}
              </p>
            </GlassCard>
          ) : (
            <>
              {pinned.length > 0 && (
                <div>
                  <p className="hud-label flex items-center gap-1.5 text-primary">
                    <Pin className="h-3 w-3" /> Pinned
                  </p>
                  <div className="mt-3 grid gap-3">
                    {pinned.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        isOwner={isOwner}
                        onEdit={() => {
                          setEditing(post);
                          setDraft({
                            title: post.title,
                            content: post.content,
                            url: post.url ?? "",
                            category: post.category,
                            pinned: post.pinned,
                          });
                          setComposerOpen(true);
                        }}
                        onDelete={() => setPendingDelete(post)}
                        onTogglePin={() => void patch(post, { pinned: !post.pinned })}
                        onToggleHide={() => void patch(post, { published: !post.published })}
                        onMove={(direction) => void move(post, direction)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <div className="grid gap-3">
                  {rest.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      isOwner={isOwner}
                      onEdit={() => {
                        setEditing(post);
                        setDraft({
                          title: post.title,
                          content: post.content,
                          url: post.url ?? "",
                          category: post.category,
                          pinned: post.pinned,
                        });
                        setComposerOpen(true);
                      }}
                      onDelete={() => setPendingDelete(post)}
                      onTogglePin={() => void patch(post, { pinned: !post.pinned })}
                      onToggleHide={() => void patch(post, { published: !post.published })}
                      onMove={(direction) => void move(post, direction)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* owner unlock */}
      <Modal
        open={unlockOpen}
        onOpenChange={(open) => {
          setUnlockOpen(open);
          setUnlockError(null);
        }}
        eyebrow="NEEGY"
        title="Owner access"
        description="Enter the owner password to manage NEEGY Links."
      >
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleUnlock();
          }}
        >
          <Field label="Password" htmlFor="owner-password" error={unlockError}>
            <TextInput
              id="owner-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" loading={unlocking} disabled={!password}>
            Unlock
          </Button>
        </form>
      </Modal>

      {/* composer / editor */}
      <Modal
        open={composerOpen}
        onOpenChange={(open) => {
          setComposerOpen(open);
          if (!open) setEditing(null);
        }}
        eyebrow={editing ? "Edit" : "New"}
        title={editing ? "Edit post" : "Create new post"}
        className="max-w-lg"
      >
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submitDraft();
          }}
        >
          <Field label="Title" htmlFor="post-title">
            <TextInput
              id="post-title"
              value={draft.title}
              maxLength={120}
              onChange={(event) => setDraft((d) => ({ ...d, title: event.target.value }))}
            />
          </Field>
          <Field label="Text" htmlFor="post-content" hint="Optional if you add a link.">
            <TextArea
              id="post-content"
              rows={4}
              value={draft.content}
              maxLength={2000}
              onChange={(event) => setDraft((d) => ({ ...d, content: event.target.value }))}
            />
          </Field>
          <Field label="Link" htmlFor="post-url" hint="https:// or http:// only.">
            <TextInput
              id="post-url"
              inputMode="url"
              placeholder="https://example.com"
              value={draft.url}
              onChange={(event) => setDraft((d) => ({ ...d, url: event.target.value }))}
            />
          </Field>
          <Field label="Category" htmlFor="post-category">
            <select
              id="post-category"
              value={draft.category}
              onChange={(event) => setDraft((d) => ({ ...d, category: event.target.value }))}
              className="h-12 w-full rounded-xl border border-border bg-input px-4 text-sm outline-none transition-all focus:border-primary/60"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={draft.pinned}
              onChange={(event) => setDraft((d) => ({ ...d, pinned: event.target.checked }))}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            <span className="font-display text-[11px] tracking-[0.18em] uppercase">Pin to top</span>
          </label>
          <Button type="submit" className="w-full" loading={saving} disabled={!draft.title.trim()}>
            {editing ? "Save changes" : "Post"}
          </Button>
        </form>
      </Modal>

      {/* delete confirm */}
      <Modal
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        eyebrow="Careful"
        title="Delete post?"
        description="This will permanently remove this post."
      >
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => void confirmDelete()}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function PostCard({
  post,
  isOwner,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleHide,
  onMove,
}: {
  post: PostDTO;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleHide: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!post.url) return;
    void navigator.clipboard.writeText(post.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <GlassCard
      className={cn(
        "animate-slide-up p-5 transition-all",
        post.pinned && "border-primary/40 shadow-[0_0_38px_-22px_var(--primary-glow)]",
        !post.published && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {post.pinned && <Pin className="h-3.5 w-3.5 text-primary" aria-label="Pinned" />}
            <span className="font-display rounded-full border border-border bg-surface px-2 py-0.5 text-[9px] tracking-[0.18em] text-muted-foreground uppercase">
              {post.category}
            </span>
            {isOwner && !post.published && (
              <span className="font-display rounded-full border border-border px-2 py-0.5 text-[9px] tracking-[0.18em] text-muted-foreground uppercase">
                Hidden
              </span>
            )}
          </div>
          <h2 className="font-display mt-2.5 text-base font-bold tracking-[0.04em]">{post.title}</h2>
          {post.content && (
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {post.content}
            </p>
          )}
        </div>

        {isOwner && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="icon" size="icon" aria-label="Post actions" type="button">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="animate-scale-in glass z-50 w-44 rounded-xl p-1.5 text-sm"
              >
                <MenuItem icon={<Pencil className="h-3.5 w-3.5" />} label="Edit" onSelect={onEdit} />
                <MenuItem
                  icon={post.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  label={post.pinned ? "Unpin" : "Pin"}
                  onSelect={onTogglePin}
                />
                <MenuItem
                  icon={post.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  label={post.published ? "Hide" : "Publish"}
                  onSelect={onToggleHide}
                />
                <MenuItem
                  icon={<MoveUp className="h-3.5 w-3.5" />}
                  label="Move up"
                  onSelect={() => onMove(-1)}
                />
                <MenuItem
                  icon={<MoveDown className="h-3.5 w-3.5" />}
                  label="Move down"
                  onSelect={() => onMove(1)}
                />
                <MenuItem
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  label="Delete"
                  onSelect={onDelete}
                  danger
                />
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>

      {post.url && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 font-mono text-xs text-primary transition-all hover:bg-primary/20"
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{hostOf(post.url)}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      )}

      <p className="mt-4 font-mono text-[10px] text-muted-foreground">{relativeDate(post.createdAt)}</p>
    </GlassCard>
  );
}

function MenuItem({
  icon,
  label,
  onSelect,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 outline-none transition-colors focus:bg-surface-hover",
        danger ? "text-destructive" : "text-muted-foreground focus:text-foreground",
      )}
    >
      {icon}
      {label}
    </DropdownMenu.Item>
  );
}
