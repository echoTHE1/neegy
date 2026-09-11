import { cn } from "@/lib/utils";

/** Geometric N/X network mark. Pure SVG so it stays crisp at any size. */
export function NexusMark({ className, glow = true }: { className?: string; glow?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="NEXUS logo"
      className={cn("h-10 w-10", glow && "drop-shadow-[0_0_14px_oklch(0.83_0.15_200/0.55)]", className)}
    >
      <defs>
        <linearGradient id="nexusGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.88 0.14 195)" />
          <stop offset="50%" stopColor="oklch(0.7 0.18 255)" />
          <stop offset="100%" stopColor="oklch(0.66 0.21 295)" />
        </linearGradient>
      </defs>
      <path
        d="M14 50V14l36 36V14"
        fill="none"
        stroke="url(#nexusGrad)"
        strokeWidth="5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path d="M14 14l36 36" stroke="url(#nexusGrad)" strokeWidth="2" opacity="0.45" />
      <circle cx="14" cy="14" r="4.5" fill="oklch(0.88 0.14 195)" />
      <circle cx="50" cy="50" r="4.5" fill="oklch(0.66 0.21 295)" />
      <circle cx="50" cy="14" r="3" fill="oklch(0.7 0.18 255)" />
      <circle cx="14" cy="50" r="3" fill="oklch(0.7 0.18 255)" />
    </svg>
  );
}

export function NexusWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-gradient font-display font-black tracking-[0.35em] uppercase",
        className,
      )}
    >
      Nexus
    </span>
  );
}

export function NexusLockup({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <NexusMark className="h-7 w-7" />
      <NexusWordmark className="text-base" />
    </span>
  );
}
