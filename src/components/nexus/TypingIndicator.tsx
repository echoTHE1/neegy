export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : "Several people are typing";

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
