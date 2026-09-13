import { cva, type VariantProps } from "class-variance-authority";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";
import { hueOf, initialsOf } from "@/lib/nexus/validation";

/* ------------------------------------------------------------------ Button */

const buttonStyles = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-wide transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "font-display text-xs uppercase tracking-[0.18em] text-primary-foreground bg-[linear-gradient(100deg,var(--primary),var(--accent),var(--violet))] shadow-[0_8px_30px_-12px_var(--primary-glow)] hover:shadow-[0_10px_40px_-10px_var(--primary-glow)] hover:-translate-y-0.5",
        outline:
          "font-display text-xs uppercase tracking-[0.18em] glass text-foreground hover:border-primary/50 hover:bg-surface-hover hover:-translate-y-0.5 hover:shadow-[0_0_28px_-10px_var(--primary-glow)]",
        ghost: "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
        danger:
          "font-display text-xs uppercase tracking-[0.18em] border border-destructive/40 bg-destructive/12 text-destructive hover:bg-destructive/20",
        icon: "glass text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-surface-hover",
      },
      size: {
        sm: "h-9 px-3.5 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-8 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles> & { loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonStyles({ variant, size }), className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
});

/* --------------------------------------------------------------- GlassCard */

export function GlassCard({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass relative rounded-2xl shadow-[var(--shadow-panel)] before:pointer-events-none before:absolute before:inset-x-8 before:-top-px before:h-px before:bg-[linear-gradient(90deg,transparent,var(--primary-glow),transparent)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------- TextFields */

const fieldBase =
  "w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-[inset_0_1px_0_oklch(1_0_0/0.05)] transition-all duration-200 outline-none focus:border-primary/60 focus:bg-surface-hover focus:shadow-[0_0_0_3px_oklch(0.78_0.16_82/0.12),inset_0_1px_0_oklch(1_0_0/0.06)]";

type FieldWrapProps = {
  label: string;
  hint?: string;
  error?: string | null;
  counter?: string;
  children: ReactNode;
  htmlFor: string;
};

export function Field({ label, hint, error, counter, children, htmlFor }: FieldWrapProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="hud-label">
          {label}
        </label>
        {counter && <span className="font-mono text-[10px] text-muted-foreground">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p className="animate-slide-up font-mono text-[11px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(fieldBase, "h-12", className)} {...rest} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(fieldBase, "py-3", className)} {...rest} />;
  },
);

/* ------------------------------------------------------------------ Avatar */

export function Avatar({
  name,
  size = 36,
  online,
  className,
}: {
  name: string;
  size?: number;
  online?: boolean;
  className?: string;
}) {
  const hue = hueOf(name);
  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <span
        className="flex h-full w-full items-center justify-center rounded-xl font-display text-[0.62em] font-bold tracking-wider text-foreground"
        style={{
          background: `linear-gradient(135deg, oklch(0.45 0.16 ${hue} / 0.85), oklch(0.3 0.12 ${hue + 40} / 0.8))`,
          boxShadow: `inset 0 0 0 1px oklch(0.8 0.14 ${hue} / 0.45)`,
          fontSize: size * 0.36,
        }}
        aria-hidden
      >
        {initialsOf(name)}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
            online ? "bg-success" : "bg-muted-foreground/60",
          )}
        />
      )}
    </span>
  );
}

/* --------------------------------------------------------------- HUD label */

export function HudTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("hud-label inline-flex items-center gap-1.5", className)}>{children}</span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-[linear-gradient(90deg,var(--surface),var(--surface-hover),var(--surface))] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
