import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

import { BackgroundFX } from "@/components/nexus/BackgroundFX";
import { InviteCode } from "@/components/nexus/InviteCode";
import { NexusLockup } from "@/components/nexus/NexusLogo";
import { Button, Field, GlassCard, TextArea, TextInput } from "@/components/nexus/primitives";
import { notify } from "@/components/nexus/toast";
import { createRoomFn } from "@/lib/nexus.functions";
import { saveSession } from "@/lib/nexus/session";
import { LIMITS } from "@/lib/nexus/validation";
import { ERROR_COPY, type RoomDTO } from "@/lib/nexus/types";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a Private Room — NEXUS" },
      {
        name: "description",
        content:
          "Name your room, pick a display name, and get a unique access code for your private NEXUS group chat.",
      },
      { property: "og:title", content: "Create a Private Room — NEXUS" },
      {
        property: "og:description",
        content: "Spin up an invite-only real-time group chat in seconds.",
      },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<RoomDTO | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    if (!displayName.trim() || !roomName.trim()) {
      setError("Enter your display name and a room name.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await createRoomFn({
        data: {
          displayName: displayName.trim(),
          roomName: roomName.trim(),
          description: description.trim(),
        },
      });
      if (!result.ok) {
        const copy = ERROR_COPY[result.error];
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
      setCreated(result.room);
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
        <Link to="/" aria-label="NEXUS home">
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
        {created ? (
          <GlassCard className="animate-scale-in p-6">
            <p className="hud-label">Room online</p>
            <h1 className="mt-1.5 font-display text-xl font-bold tracking-[0.12em] uppercase">
              {created.name}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Share this code with the people you want inside. Keep it private — anyone holding it
              can join.
            </p>
            <InviteCode code={created.code} roomName={created.name} className="mt-5" />
            <Button
              className="mt-4 w-full"
              onClick={() => void navigate({ to: "/room/$roomId", params: { roomId: created.id } })}
            >
              Enter room <ArrowRight className="h-4 w-4" />
            </Button>
          </GlassCard>
        ) : (
          <GlassCard className="animate-slide-up p-6">
            <p className="hud-label">New channel</p>
            <h1 className="mt-1.5 font-display text-xl font-bold tracking-[0.12em] uppercase">
              Create a room
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              No account needed. You'll get a unique access code the moment it's created.
            </p>

            <form className="mt-6 space-y-5" onSubmit={(event) => void submit(event)} noValidate>
              <Field
                label="Your display name"
                htmlFor="displayName"
                counter={`${displayName.length}/${LIMITS.displayName}`}
                hint="This is how members see you in the room."
              >
                <TextInput
                  id="displayName"
                  value={displayName}
                  autoFocus
                  maxLength={LIMITS.displayName}
                  placeholder="e.g. Ava"
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </Field>

              <Field
                label="Room name"
                htmlFor="roomName"
                counter={`${roomName.length}/${LIMITS.roomName}`}
              >
                <TextInput
                  id="roomName"
                  value={roomName}
                  maxLength={LIMITS.roomName}
                  placeholder="e.g. Launch war room"
                  onChange={(event) => setRoomName(event.target.value)}
                />
              </Field>

              <Field
                label="Description"
                htmlFor="description"
                counter={`${description.length}/${LIMITS.description}`}
                hint="Optional. A short line about what this room is for."
                error={error}
              >
                <TextArea
                  id="description"
                  rows={3}
                  value={description}
                  maxLength={LIMITS.description}
                  placeholder="Optional"
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {loading ? "Creating" : "Create room"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Already have a code?{" "}
              <Link to="/join" className="text-primary hover:underline">
                Join a room
              </Link>
            </p>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
