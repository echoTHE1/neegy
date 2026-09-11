import { cn } from "@/lib/utils";
import type { ConnectionState } from "@/hooks/useNexusRoom";

const MAP: Record<ConnectionState, { label: string; glyph: string; tone: string }> = {
  connected: { label: "Connected", glyph: "●", tone: "text-success" },
  connecting: { label: "Connecting", glyph: "◌", tone: "text-primary animate-glow-pulse" },
  reconnecting: { label: "Reconnecting", glyph: "↻", tone: "text-warning animate-glow-pulse" },
  offline: { label: "Offline", glyph: "○", tone: "text-destructive" },
};

export function ConnectionBadge({ state, className }: { state: ConnectionState; className?: string }) {
  const item = MAP[state];
  return (
    <span
      className={cn("hud-label inline-flex items-center gap-1.5", className)}
      role="status"
      aria-label={`Connection ${item.label}`}
    >
      <span className={cn("text-[11px] leading-none", item.tone)} aria-hidden>
        {item.glyph}
      </span>
      {item.label}
    </span>
  );
}
