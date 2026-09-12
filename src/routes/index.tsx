import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Lock, Radio, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { BackgroundFX } from "@/components/nexus/BackgroundFX";
import { NexusLockup, NexusMark, NexusWordmark } from "@/components/nexus/NexusLogo";
import { Button, GlassCard, HudTag } from "@/components/nexus/primitives";
import { clearSession, loadSession } from "@/lib/nexus/session";
import type { SessionDTO } from "@/lib/nexus/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEXUS — Private Real-Time Group Chat Rooms" },
      {
        name: "description",
        content:
          "Create an encrypted-feeling private group chat in seconds. Share one access code — only people with it can join. No accounts, no discovery, real-time messaging.",
      },
      { property: "og:title", content: "NEXUS — Private Real-Time Group Chat Rooms" },
      {
        property: "og:description",
        content:
          "Spin up a private room, share the access code, and chat in real time. No sign-up required.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Lock,
    title: "Invite-only",
    body: "Every room is private. Access is granted by a single unguessable code you control.",
  },
  {
    icon: Radio,
    title: "Real-time",
    body: "Messages, reactions, typing and presence sync instantly across every connected device.",
  },
  {
    icon: Users,
    title: "No accounts",
    body: "Pick a display name and you're in. Nothing to sign up for, nothing to verify.",
  },
  {
    icon: Sparkles,
    title: "Full control",
    body: "Owners can rename the room, rotate the code, remove members, clear history or shut it down.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDTO | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundFX />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <NexusLockup />
        <Link
          to="/join"
          className="hud-label text-muted-foreground transition-colors hover:text-foreground"
        >
          Have a code?
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24">
        <section className="animate-fade-in flex flex-col items-center pt-10 text-center sm:pt-16">
          <HudTag className="rounded-full border border-border bg-surface px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden /> Private channels ·
            live
          </HudTag>

          <NexusMark className="mt-8 h-16 w-16 animate-float" />

          <h1 className="mt-6 font-display text-[clamp(2.4rem,9vw,4.5rem)] leading-[0.95] font-black tracking-[0.06em] uppercase">
            <span className="text-gradient">Private rooms</span>
            <br />
            for your people
          </h1>

          <p className="mt-5 max-w-xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
            <NexusWordmark className="text-sm" /> creates a sealed group chat in one click. Share the
            access code with your crew — nobody else can find it, request it, or join it.
          </p>

          <div className="mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="flex-1" onClick={() => void navigate({ to: "/create" })}>
              Create a room <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => void navigate({ to: "/join" })}
            >
              <KeyRound className="h-4 w-4" /> Join with code
            </Button>
          </div>

          {session && (
            <GlassCard className="animate-slide-up mt-8 w-full max-w-md p-4 text-left">
              <p className="hud-label">Resume session</p>
              <p className="mt-1.5 truncate text-sm">
                You're still a member of{" "}
                <span className="font-medium text-foreground">{session.roomName}</span> as{" "}
                {session.displayName}.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    void navigate({ to: "/room/$roomId", params: { roomId: session.roomId } })
                  }
                >
                  Re-enter room
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    clearSession();
                    setSession(null);
                  }}
                >
                  Forget
                </Button>
              </div>
            </GlassCard>
          )}
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <GlassCard key={title} className="animate-slide-up p-5">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="mt-3 font-display text-xs tracking-[0.18em] uppercase">{title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </GlassCard>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="hud-label text-center">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["01", "Create", "Name yourself and your room. We generate a unique access code."],
              ["02", "Share", "Send the code to the people you want inside. Only they can enter."],
              ["03", "Chat", "Talk in real time with replies, reactions, presence and typing."],
            ].map(([step, title, body]) => (
              <li key={step} className="glass rounded-2xl p-5">
                <span className="font-mono text-xs text-primary">{step}</span>
                <h3 className="mt-2 font-display text-sm tracking-[0.14em] uppercase">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60 px-5 py-6 text-center">
        <p className="font-mono text-[11px] text-muted-foreground">
          NEXUS · private group channels · no tracking, no discovery
        </p>
      </footer>
    </div>
  );
}
