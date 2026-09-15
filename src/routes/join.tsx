import { Link, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { BackgroundFX } from "@/components/nexus/BackgroundFX";
import { NexusLockup } from "@/components/nexus/NexusLogo";
import { Button, Field, GlassCard, TextInput } from "@/components/nexus/primitives";
import { notify } from "@/components/nexus/toast";
import { joinRoomFn } from "@/lib/nexus.functions";
import { saveSession } from "@/lib/nexus/session";
import { LIMITS, formatCodeInput } from "@/lib/nexus/validation";
import { getErrorCopy } from "@/lib/nexus/types";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join a Private Room — NEEGY" },
      {
        name: "description",
        content:
          "Enter your NEEGY access code and a display name to join a private, real-time group chat room.",
      },
      { property: "og:title", content: "Join a Private Room — NEEGY" },
      {
        property: "og:description",
        content: "Got an access code? Enter it here to join the room instantly.",
      },
    ],
  }),
  component: () => <JoinScreen />,
});

export function JoinScreen({ presetCode }: { presetCode?: string }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState(presetCode ? formatCodeInput(presetCode) : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    if (!displayName.trim() || !code.trim()) {
      setError("Enter a display name and an access code.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await joinRoomFn({ data: { displayName: displayName.trim(), code } });
      if (!result.ok) {
        const copy = getErrorCopy(result.error);
        setError(copy.detail);
        notify.error(copy.title, copy.detail);
        return;
      }
      saveSession({
        roomId: result.room.id,
        memberId: result.member.id,
        token: result.token,
        displayName: result.member.displayName,
        roomName: result.room.name,
      });
      notify.success("Access granted", `Welcome to ${result.room.name}`);
      void navigate({ to: "/room/$roomId", params: { roomId: result.room.id } });
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundFX />
      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-6">
        <Link to="/" aria-label="NEEGY home">
          <NexusLockup />
        </Link>
        <Link
          to="/"
          className="hud-label inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-lg px-5 pb-20">
        <GlassCard className="animate-slide-up p-6">
          <p className="hud-label">Access required</p>
          <h1 className="mt-1.5 font-display text-xl font-bold tracking-[0.12em] uppercase">
            Join a room
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Rooms are invite-only. Paste the code you were given to get in.
          </p>

          <form className="mt-6 space-y-5" onSubmit={(event) => void submit(event)} noValidate>
            <Field
              label="Your display name"
              htmlFor="joinName"
              counter={`${displayName.length}/${LIMITS.displayName}`}
            >
              <TextInput
                id="joinName"
                value={displayName}
                autoFocus
                maxLength={LIMITS.displayName}
                placeholder="e.g. Ava"
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </Field>

            <Field label="Access code" htmlFor="joinCode" hint="Format: NXS-XXX-XXX" error={error}>
              <TextInput
                id="joinCode"
                value={code}
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="NXS-A1B-2C3"
                className="text-center font-mono text-lg tracking-[0.24em] uppercase"
                onChange={(event) => setCode(formatCodeInput(event.target.value))}
              />
            </Field>

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {loading ? "Verifying" : "Enter room"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            No code?{" "}
            <Link to="/create" className="text-primary hover:underline">
              Create your own room
            </Link>
          </p>
        </GlassCard>
      </main>
    </div>
  );
}

export function JoinWithParam() {
  const { code } = useParams({ from: "/join/$code" });
  return <JoinScreen presetCode={code} />;
}
