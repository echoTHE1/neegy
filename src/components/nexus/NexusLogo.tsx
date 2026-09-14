import { cn } from "@/lib/utils";

/** NEEGY brand mark using the supplied mascot artwork. */
export function NexusMark({ className, glow = true }: { className?: string; glow?: boolean }) {
  return (
    <span
      role="img"
      aria-label="NEEGY logo"
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[28%] bg-black/20",
        glow && "drop-shadow-[0_0_18px_var(--primary-glow)]",
        className,
      )}
    >
      <img
        src="/neegy-logo.png"
        alt=""
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  );
}

export function NexusWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("text-gradient font-display font-black tracking-[0.28em] uppercase", className)}
    >
      Neegy
    </span>
  );
}

export function NexusLockup({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <NexusMark className="h-8 w-8" />
      <NexusWordmark className="text-base" />
    </span>
  );
}
