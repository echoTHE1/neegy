import { Check, Copy, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/nexus/primitives";
import { notify } from "@/components/nexus/toast";
import { cn } from "@/lib/utils";

export function InviteCode({
  code,
  roomName,
  className,
}: {
  code: string;
  roomName: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 900);
    return () => clearTimeout(timer);
  }, [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      notify.success("Invite code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error("Couldn't copy", "Select the code and copy it manually.");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/join/${code}`;
    try {
      await navigator.share({
        title: `Join ${roomName} on NEXUS`,
        text: `Join my private NEXUS room with code ${code}`,
        url,
      });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-primary/25 bg-[linear-gradient(135deg,oklch(0.83_0.15_200/0.1),oklch(0.66_0.21_295/0.12))] px-4 py-6 text-center transition-shadow duration-500",
          flash && "shadow-[0_0_60px_-12px_oklch(0.83_0.15_200/0.9)]",
        )}
      >
        <p className="hud-label">Access code</p>
        <p
          key={code}
          className="animate-scale-in mt-2 font-mono text-[clamp(1.5rem,7vw,2.5rem)] font-bold tracking-[0.12em] text-gradient"
        >
          {code}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Anyone with this code can join. Share it only with your people.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => void copy()} className="flex-1">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy code"}
        </Button>
        {canShare && (
          <Button variant="outline" onClick={() => void share()} className="flex-1">
            <Share2 className="h-4 w-4" />
            Share code
          </Button>
        )}
      </div>
    </div>
  );
}
