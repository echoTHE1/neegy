import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { BackgroundFX } from "@/components/nexus/BackgroundFX";
import { NexusLockup } from "@/components/nexus/NexusLogo";
import { Button, Field, GlassCard, TextInput } from "@/components/nexus/primitives";
import { notify } from "@/components/nexus/toast";
import { createRoomFn } from "@/lib/nexus.functions";
import { saveSession } from "@/lib/nexus/session";
import { LIMITS } from "@/lib/nexus/validation";
import { getErrorCopy } from "@/lib/nexus/types";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a Private Room — NEEGY" },
      {
        name: "description",
        content:
          "Spin up a private, invite-only NEEGY room in seconds and share the access code with your group.",
      },
      { property: "og:title", content: "Create a Private Room — NEEGY" },
      {
        property: "og:description",
        content: "Create an invite-only real-time group chat and get a unique access code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateScreen,
});

function CreateScreen() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    if (!displayName.trim() || !roomName.trim()) {
      setError("Enter a display name and a room name.");
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
      notify.success("Room created", `${result.room.name} is live`);
      void navigate({ to: "/room/$roomId", params: { roomId: result.room.id } });
<<<<<<< HEAD
    } catch (error) {
      console.error("[NEEGY] CREATE ROOM failed:", error);
      setError(
        "The room server is unavailable. Check Supabase server configuration and try again.",
      );
      notify.error(
        "ROOM SERVER UNAVAILABLE",
        "Check the Supabase server configuration and deployment.",
      );
=======
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
>>>>>>> f675e0f6ffc6831c33824b1faa7fc639a9c8908a
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
          <p className="hud-label">New channel</p>
          <h1 className="mt-1.5 font-display text-xl font-bold tracking-[0.12em] uppercase">
            Create a room
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            You'll get a unique access code. Only people with that code can join.
          </p>

          <form className="mt-6 space-y-5" onSubmit={(event) => void submit(event)} noValidate>
            <Field
              label="Your display name"
              htmlFor="createName"
              counter={`${displayName.length}/${LIMITS.displayName}`}
            >
              <TextInput
                id="createName"
                value={displayName}
                autoFocus
                maxLength={LIMITS.displayName}
                placeholder="e.g. Ava"
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </Field>

            <Field
              label="Room name"
              htmlFor="createRoom"
              counter={`${roomName.length}/${LIMITS.roomName}`}
              error={error}
            >
              <TextInput
                id="createRoom"
                value={roomName}
                maxLength={LIMITS.roomName}
                placeholder="e.g. Night Ops"
                onChange={(event) => setRoomName(event.target.value)}
              />
            </Field>

            <Field
              label="Description (optional)"
              htmlFor="createDesc"
              counter={`${description.length}/${LIMITS.description}`}
            >
              <TextInput
                id="createDesc"
                value={description}
                maxLength={LIMITS.description}
                placeholder="What's this room for?"
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
      </main>
    </div>
  );
}
