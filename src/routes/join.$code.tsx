import { createFileRoute } from "@tanstack/react-router";

import { JoinWithParam } from "./join";

export const Route = createFileRoute("/join/$code")({
  head: () => ({
    meta: [
      { title: "Join a Private Room — NEEGY" },
      {
        name: "description",
        content:
          "Your access code is pre-filled. Add a display name to enter this private NEEGY room.",
      },
      { property: "og:title", content: "You're invited to a NEEGY room" },
      {
        property: "og:description",
        content: "Add a display name to enter this private real-time group chat.",
      },
    ],
  }),
  component: JoinWithParam,
});
