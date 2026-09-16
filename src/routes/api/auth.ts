import { json } from "@tanstack/react-start";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  verifyUserSession,
} from "@/lib/nexus/auth.server";

export async function POST(request: Request) {
  const url = new URL(request.url);

  if (url.pathname === "/api/auth/register") {
    return handleRegister(request);
  }
  if (url.pathname === "/api/auth/login") {
    return handleLogin(request);
  }
  if (url.pathname === "/api/auth/logout") {
    return handleLogout(request);
  }
  if (url.pathname === "/api/auth/verify-session") {
    return handleVerifySession(request);
  }
  if (url.pathname === "/api/auth/update-profile") {
    return handleUpdateProfile(request);
  }

  return json({ error: "Not found" }, { status: 404 });
}

async function handleRegister(request: Request) {
  try {
    const body = (await request.json()) as {
      username: string;
      displayName: string;
      email: string;
      passwordHash: string;
    };

    const result = await registerUser({
      username: body.username,
      displayName: body.displayName,
      email: body.email,
      passwordHash: body.passwordHash,
    });

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({
      user: result.user,
      authToken: result.authToken,
    });
  } catch (error) {
    console.error("Register error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleLogin(request: Request) {
  try {
    const body = (await request.json()) as {
      email: string;
      passwordHash: string;
    };

    const result = await loginUser({
      email: body.email,
      passwordHash: body.passwordHash,
    });

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({
      user: result.user,
      authToken: result.authToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleLogout(request: Request) {
  try {
    const body = (await request.json()) as {
      userId: string;
      token: string;
    };

    const result = await logoutUser({
      userId: body.userId,
      token: body.token,
    });

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({ ok: true });
  } catch (error) {
    console.error("Logout error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleVerifySession(request: Request) {
  try {
    const body = (await request.json()) as {
      userId: string;
      token: string;
    };

    const result = await verifyUserSession(body.userId, body.token);

    if ("ok" in result && result.ok === false) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({ user: result });
  } catch (error) {
    console.error("Verify session error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleUpdateProfile(request: Request) {
  try {
    const body = (await request.json()) as {
      userId: string;
      token: string;
      displayName?: string;
      avatar?: string | null;
    };

    const result = await updateUserProfile({
      userId: body.userId,
      token: body.token,
      ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
      ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
    });

    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }

    return json({ user: result.user });
  } catch (error) {
    console.error("Update profile error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
