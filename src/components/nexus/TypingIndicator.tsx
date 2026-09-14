export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const visibleNames = names.slice(0, 3);
  const label =
    names.length === 1
      ? `${visibleNames[0]} is typing`
      : names.length === 2
        ? `${visibleNames[0]} and ${visibleNames[1]} are typing`
        : names.length === 3
          ? `${visibleNames[0]}, ${visibleNames[1]}, and ${visibleNames[2]} are typing`
          : `${visibleNames[0]}, ${visibleNames[1]}, ${visibleNames[2]}, and ${names.length - 3} other${names.length - 3 === 1 ? "" : "s"} are typing`;

  return (
    <div
      aria-live="polite"
      className="animate-fade-in flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground"
    >
      <span className="flex items-center gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-dot h-1.5 w-1.5 rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </span>
      <span className="font-mono text-[11px]">{label}…</span>
    </div>
  );
}
