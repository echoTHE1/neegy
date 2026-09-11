import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-fade-in fixed inset-0 z-50 bg-background/70 backdrop-blur-md" />
        <Dialog.Content
          className={cn(
            "animate-scale-in glass fixed top-1/2 left-1/2 z-50 max-h-[88vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl p-6 shadow-[var(--shadow-panel)] scrollbar-thin",
            className,
          )}
        >
          {eyebrow && <p className="hud-label mb-2">{eyebrow}</p>}
          <Dialog.Title className="font-display text-lg font-bold tracking-[0.12em] uppercase">
            {title}
          </Dialog.Title>
          <Dialog.Description
            className={cn("mt-1.5 text-sm text-muted-foreground", !description && "sr-only")}
          >
            {description ?? title}
          </Dialog.Description>
          <div className="mt-5">{children}</div>
          <Dialog.Close
            aria-label="Close"
            className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
