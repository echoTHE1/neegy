import { Crown, UserMinus } from "lucide-react";

import { Avatar, Skeleton } from "@/components/nexus/primitives";
import { cn } from "@/lib/utils";
import type { MemberDTO } from "@/lib/nexus/types";

export function MemberList({
  members,
  onlineIds,
  myId,
  amOwner,
  loading,
  onRemove,
}: {
  members: MemberDTO[];
  onlineIds: string[];
  myId: string;
  amOwner: boolean;
  loading?: boolean;
  onRemove: (member: MemberDTO) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  const sorted = [...members].sort((a, b) => {
    const online = Number(onlineIds.includes(b.id)) - Number(onlineIds.includes(a.id));
    if (online !== 0) return online;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <ul className="space-y-1 p-2">
      {sorted.map((member) => {
        const online = onlineIds.includes(member.id);
        return (
          <li
            key={member.id}
            className="animate-slide-up group flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-surface-hover"
          >
            <Avatar name={member.displayName} size={32} online={online} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {member.displayName}
                {member.id === myId && <span className="ml-1 text-muted-foreground">(you)</span>}
              </p>
              <p className="flex items-center gap-1.5">
                <span
                  className={cn("hud-label", online ? "text-success" : "text-muted-foreground")}
                >
                  {online ? "Online" : "Offline"}
                </span>
                {member.isOwner && (
                  <span className="hud-label inline-flex items-center gap-1 text-primary">
                    <Crown className="h-2.5 w-2.5" /> Owner
                  </span>
                )}
              </p>
            </div>
            {amOwner && member.id !== myId && (
              <button
                type="button"
                aria-label={`Remove ${member.displayName}`}
                onClick={() => onRemove(member)}
                className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-destructive/15 hover:text-destructive"
              >
                <UserMinus className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
