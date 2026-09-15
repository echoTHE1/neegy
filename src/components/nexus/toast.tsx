import { Toaster, toast } from "sonner";

export function NexusToaster() {
  return (
    <Toaster
      position="top-center"
      offset={16}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "glass flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-foreground shadow-[var(--shadow-panel)]",
          title: "font-display text-[11px] uppercase tracking-[0.16em]",
          description: "text-xs text-muted-foreground",
        },
      }}
    />
  );
}

export const notify = {
  success: (title: string, description?: string) =>
    toast.success(title, description ? { description } : undefined),
  error: (title: string, description?: string) =>
    toast.error(title, description ? { description } : undefined),
  info: (title: string, description?: string) =>
    toast(title, description ? { description } : undefined),
};
