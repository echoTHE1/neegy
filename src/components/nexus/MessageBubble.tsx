import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Copy, CornerUpLeft, MoreHorizontal, Pencil, SmilePlus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Avatar, Button, TextArea } from "@/components/nexus/primitives";
import { notify } from "@/components/nexus/toast";
import { cn } from "@/lib/utils";
import { REACTION_SET, type MessageDTO } from "@/lib/nexus/types";

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function SystemMessage({ message }: { message: MessageDTO }) {
  return (
    <div className="animate-fade-in flex justify-center py-1.5">
      <span className="hud-label rounded-full border border-border bg-surface px-3 py-1 text-[10px]">
        {message.body}
      </span>
    </div>
  );
}

export function MessageBubble({
  message,
  isMine,
  myMemberId,
  replyTarget,
  showTimestamp,
  compact,
  canDelete,
  onReply,
  onReact,
  onEdit,
  onDelete,
}: {
  message: MessageDTO;
  isMine: boolean;
  myMemberId: string;
  replyTarget?: MessageDTO | undefined;
  showTimestamp: boolean;
  compact: boolean;
  canDelete: boolean;
  onReply: (message: MessageDTO) => void;
  onReact: (id: string, emoji: string) => void;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const deleted = Boolean(message.deletedAt);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.body);
      notify.success("Message copied");
    } catch {
      notify.error("Couldn't copy", "Your browser blocked clipboard access.");
    }
  };

  return (
    <div
      className={cn(
        "group/message flex gap-2.5",
        isMine ? "animate-slide-in-right flex-row-reverse" : "animate-slide-in-left",
        compact ? "py-0.5" : "py-1.5",
      )}
    >
      {!isMine && <Avatar name={message.authorName} size={32} className="mt-5" />}

      <div className={cn("flex min-w-0 max-w-[min(78%,34rem)] flex-col", isMine && "items-end")}>
        <div className={cn("flex items-baseline gap-2 px-1", isMine && "flex-row-reverse")}>
          <span className="font-display text-[11px] tracking-[0.1em] uppercase text-foreground/80">
            {isMine ? "You" : message.authorName}
          </span>
          {showTimestamp && (
            <time
              className="font-mono text-[10px] text-muted-foreground"
              dateTime={message.createdAt}
              title={new Date(message.createdAt).toLocaleString()}
            >
              {timeOf(message.createdAt)}
            </time>
          )}
        </div>

        <div className={cn("mt-1 flex items-center gap-1", isMine && "flex-row-reverse")}>
          <div
            className={cn(
              "min-w-0 rounded-2xl border px-3.5 py-2.5 text-sm break-words whitespace-pre-wrap",
              isMine
                ? "border-primary/25 bg-[linear-gradient(135deg,oklch(0.78_0.16_82/0.14),oklch(0.67_0.14_65/0.14))]"
                : "border-border bg-surface",
              deleted && "italic text-muted-foreground",
            )}
          >
            {replyTarget && !deleted && (
              <div className="mb-2 truncate border-l-2 border-primary/50 pl-2 text-[11px] text-muted-foreground">
                <span className="font-display tracking-wider uppercase">{replyTarget.authorName}</span>{" "}
                {replyTarget.deletedAt ? "message deleted" : replyTarget.body.slice(0, 90)}
              </div>
            )}

            {deleted ? (
              "This message was deleted"
            ) : editing ? (
              <div className="w-[min(60vw,20rem)] space-y-2">
                <TextArea
                  value={draft}
                  rows={2}
                  autoFocus
                  onChange={(event) => setDraft(event.target.value)}
                  aria-label="Edit message"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const value = draft.trim();
                      if (value && value !== message.body) onEdit(message.id, value);
                      setEditing(false);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {message.body}
                {message.editedAt && (
                  <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">edited</span>
                )}
              </>
            )}
          </div>

          {!deleted && !editing && (
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/message:opacity-100">
              <button
                type="button"
                aria-label="Reply"
                onClick={() => onReply(message)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              >
                <CornerUpLeft className="h-3.5 w-3.5" />
              </button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    aria-label="Add reaction"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  >
                    <SmilePlus className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    sideOffset={6}
                    className="animate-scale-in glass z-50 flex gap-1 rounded-xl p-1.5"
                  >
                    {REACTION_SET.map((emoji) => (
                      <DropdownMenu.Item
                        key={emoji}
                        onSelect={() => onReact(message.id, emoji)}
                        className="cursor-pointer rounded-lg px-1.5 py-1 text-base outline-none transition-transform hover:scale-125 focus:scale-125"
                      >
                        {emoji}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    aria-label="Message actions"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    sideOffset={6}
                    align={isMine ? "end" : "start"}
                    className="animate-scale-in glass z-50 min-w-40 rounded-xl p-1.5 text-sm"
                  >
                    <MenuItem onSelect={() => onReply(message)} icon={<CornerUpLeft className="h-3.5 w-3.5" />}>
                      Reply
                    </MenuItem>
                    <MenuItem onSelect={copy} icon={<Copy className="h-3.5 w-3.5" />}>
                      Copy text
                    </MenuItem>
                    {isMine && (
                      <MenuItem
                        onSelect={() => {
                          setDraft(message.body);
                          setEditing(true);
                        }}
                        icon={<Pencil className="h-3.5 w-3.5" />}
                      >
                        Edit
                      </MenuItem>
                    )}
                    {(isMine || canDelete) && (
                      <MenuItem
                        destructive
                        onSelect={() => onDelete(message.id)}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                      >
                        Delete
                      </MenuItem>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          )}
        </div>

        {Object.keys(message.reactions).length > 0 && !deleted && (
          <div className={cn("mt-1.5 flex flex-wrap gap-1", isMine && "justify-end")}>
            {Object.entries(message.reactions).map(([emoji, ids]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(message.id, emoji)}
                aria-pressed={ids.includes(myMemberId)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                  ids.includes(myMemberId)
                    ? "border-primary/50 bg-primary/15 text-foreground"
                    : "border-border bg-surface text-muted-foreground hover:bg-surface-hover",
                )}
              >
                <span>{emoji}</span>
                <span className="font-mono text-[10px]">{ids.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  children,
  icon,
  onSelect,
  destructive,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs outline-none transition-colors",
        destructive
          ? "text-destructive hover:bg-destructive/12 focus:bg-destructive/12"
          : "text-foreground/85 hover:bg-surface-hover focus:bg-surface-hover",
      )}
    >
      {icon}
      {children}
    </DropdownMenu.Item>
  );
}
