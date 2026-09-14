import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CornerUpLeft, SendHorizontal, Smile, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/nexus/primitives";
import { LIMITS } from "@/lib/nexus/validation";
import { cn } from "@/lib/utils";
import type { MessageDTO } from "@/lib/nexus/types";

const QUICK_EMOJI = ["😀", "😂", "🔥", "❤️", "👍", "🎉", "😮", "🙌", "✨", "🤝", "👀", "💀"];

export function MessageComposer({
  roomName,
  replyTo,
  onCancelReply,
  onSend,
  onTyping,
  disabled,
}: {
  roomName: string;
  replyTo: MessageDTO | null;
  onCancelReply: () => void;
  onSend: (body: string) => Promise<boolean>;
  onTyping: (active: boolean) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      onTyping(false);
    };
  }, [onTyping]);

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [value]);

  const submit = async () => {
    const body = value.trim();
    if (!body || sending || disabled) return;
    setSending(true);
    const ok = await onSend(body);
    setSending(false);
    if (ok) {
      setValue("");
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      onTyping(false);
      onCancelReply();
    }
  };

  const remaining = LIMITS.message - value.length;

  return (
    <div className="border-t border-border bg-background/70 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-4">
      {replyTo && (
        <div className="animate-slide-up mb-2 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs">
          <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            <span className="font-display tracking-wider text-foreground/80 uppercase">
              Replying to {replyTo.authorName}
            </span>{" "}
            — {replyTo.body.slice(0, 80)}
          </span>
          <button
            type="button"
            aria-label="Cancel reply"
            onClick={onCancelReply}
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button variant="icon" size="icon" aria-label="Insert emoji" type="button">
              <Smile className="h-4 w-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={8}
              className="animate-scale-in glass z-50 grid w-56 grid-cols-6 gap-1 rounded-xl p-2"
            >
              {QUICK_EMOJI.map((emoji) => (
                <DropdownMenu.Item
                  key={emoji}
                  onSelect={() => setValue((prev) => prev + emoji)}
                  className="cursor-pointer rounded-lg p-1 text-center text-lg outline-none transition-transform hover:scale-125 focus:scale-125"
                >
                  {emoji}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled}
            aria-label={`Message ${roomName}`}
            placeholder={`Message ${roomName}`}
            maxLength={LIMITS.message}
            onChange={(event) => {
              const nextValue = event.target.value;
              setValue(nextValue);
              const active = Boolean(nextValue.trim());
              onTyping(active);
              if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
              if (active) {
                typingStopTimer.current = setTimeout(() => onTyping(false), 2600);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            className="max-h-40 w-full resize-none rounded-xl border border-border bg-input px-4 py-3 pr-14 text-sm shadow-[inset_0_1px_0_oklch(1_0_0/0.05)] outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-surface-hover focus:shadow-[0_0_0_3px_oklch(0.78_0.16_82/0.12)] disabled:opacity-50 scrollbar-thin"
          />
          {remaining < 200 && (
            <span
              className={cn(
                "absolute right-3 bottom-2 font-mono text-[10px]",
                remaining < 0 ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {remaining}
            </span>
          )}
        </div>

        <Button
          size="icon"
          aria-label="Send message"
          onClick={() => void submit()}
          loading={sending}
          disabled={!value.trim() || disabled}
          className={cn("h-11 w-11 rounded-xl", value.trim() && "animate-glow-pulse")}
        >
          {!sending && <SendHorizontal className="h-4 w-4" />}
        </Button>
      </div>
      <p className="mt-1.5 hidden px-1 font-mono text-[10px] text-muted-foreground sm:block">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
