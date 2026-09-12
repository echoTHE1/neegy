import { json } from "@tanstack/react-start";
import {
  addLink,
  updateLink,
  deleteLink,
  getChannelLinks,
  reorderLinks,
} from "@/lib/nexus/links.server";

export async function POST(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === "/api/links/list") {
    return handleGetLinks(request);
  }
  if (url.pathname === "/api/links/add") {
    return handleAddLink(request);
  }
  if (url.pathname === "/api/links/update") {
    return handleUpdateLink(request);
  }
  if (url.pathname === "/api/links/delete") {
    return handleDeleteLink(request);
  }
  if (url.pathname === "/api/links/reorder") {
    return handleReorderLinks(request);
  }

  return json({ error: "Not found" }, { status: 404 });
}

async function handleGetLinks(request: Request) {
  try {
    const body = await request.json() as {
      roomId: string;
      token: string;
    };

    const result = await getChannelLinks({
      roomId: body.roomId,
      token: body.token,
    });

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({ links: result.links });
  } catch (error) {
    console.error("Get links error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleAddLink(request: Request) {
  try {
    const body = await request.json() as {
      roomId: string;
      token: string;
      title: string;
      url: string;
      description: string;
      category: string;
      icon?: string | null;
      pinned?: boolean;
    };

    const result = await addLink({
      roomId: body.roomId,
      token: body.token,
      title: body.title,
      url: body.url,
      description: body.description,
      category: body.category,
      icon: body.icon,
      pinned: body.pinned,
    });

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({ link: result.link });
  } catch (error) {
    console.error("Add link error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleUpdateLink(request: Request) {
  try {
    const body = await request.json() as {
      roomId: string;
      token: string;
      linkId: string;
      title?: string;
      url?: string;
      description?: string;
      category?: string;
      icon?: string | null;
      pinned?: boolean;
      published?: boolean;
    };

    const result = await updateLink({
      roomId: body.roomId,
      token: body.token,
      linkId: body.linkId,
      title: body.title,
      url: body.url,
      description: body.description,
      category: body.category,
      icon: body.icon,
      pinned: body.pinned,
      published: body.published,
    });

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({ link: result.link });
  } catch (error) {
    console.error("Update link error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleDeleteLink(request: Request) {
  try {
    const body = await request.json() as {
      roomId: string;
      token: string;
      linkId: string;
    };

    const result = await deleteLink({
      roomId: body.roomId,
      token: body.token,
      linkId: body.linkId,
    });

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({ ok: true });
  } catch (error) {
    console.error("Delete link error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleReorderLinks(request: Request) {
  try {
    const body = await request.json() as {
      roomId: string;
      token: string;
      linkIds: string[];
    };

    const result = await reorderLinks({
      roomId: body.roomId,
      token: body.token,
      linkIds: body.linkIds,
    });

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({ links: result.links });
  } catch (error) {
    console.error("Reorder links error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
