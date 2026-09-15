import { useState, useCallback, useEffect } from "react";
import type { UserDTO } from "@/lib/nexus/auth.server";

export type AuthState = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

export interface UseAuthReturn {
  state: AuthState;
  user: UserDTO | null;
  userId: string | null;
  authToken: string | null;
  error: string | null;
  register: (
    username: string,
    displayName: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateProfile: (displayName?: string, avatar?: string | null) => Promise<boolean>;
}

const STORAGE_KEY_USER_ID = "nexus_user_id";
const STORAGE_KEY_AUTH_TOKEN = "nexus_auth_token";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>("idle");
  const [user, setUser] = useState<UserDTO | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load persisted session on mount
  useEffect(() => {
    const checkPersistedSession = async () => {
      const persistedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);
      const persistedToken = localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);

      if (persistedUserId && persistedToken) {
        setState("loading");
        try {
          const response = await fetch("/api/auth/verify-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: persistedUserId, token: persistedToken }),
          });

          if (response.ok) {
            const data = (await response.json()) as { user: UserDTO };
            setUser(data.user);
            setUserId(persistedUserId);
            setAuthToken(persistedToken);
            setState("authenticated");
          } else {
            localStorage.removeItem(STORAGE_KEY_USER_ID);
            localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
            setState("unauthenticated");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Session verification failed");
          setState("unauthenticated");
        }
      } else {
        setState("unauthenticated");
      }
    };

    void checkPersistedSession();
  }, []);

  const register = useCallback(
    async (username: string, displayName: string, email: string, password: string) => {
      if (!username || !displayName || !email || !password) {
        setError("All fields are required");
        return false;
      }

      setState("loading");
      setError(null);

      try {
        const passwordHash = await hashPassword(password);

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            displayName,
            email,
            passwordHash,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          setError(errorData.error || "Registration failed");
          setState("error");
          return false;
        }

        const data = (await response.json()) as { user: UserDTO; authToken: string };
        setUser(data.user);
        setUserId(data.user.id);
        setAuthToken(data.authToken);
        localStorage.setItem(STORAGE_KEY_USER_ID, data.user.id);
        localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, data.authToken);
        setState("authenticated");
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Registration failed";
        setError(errorMsg);
        setState("error");
        return false;
      }
    },
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }

    setState("loading");
    setError(null);

    try {
      const passwordHash = await hashPassword(password);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passwordHash }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        setError(errorData.error || "Login failed");
        setState("error");
        return false;
      }

      const data = (await response.json()) as { user: UserDTO; authToken: string };
      setUser(data.user);
      setUserId(data.user.id);
      setAuthToken(data.authToken);
      localStorage.setItem(STORAGE_KEY_USER_ID, data.user.id);
      localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, data.authToken);
      setState("authenticated");
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Login failed";
      setError(errorMsg);
      setState("error");
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (!userId || !authToken) return;

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token: authToken }),
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    localStorage.removeItem(STORAGE_KEY_USER_ID);
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    setUser(null);
    setUserId(null);
    setAuthToken(null);
    setState("unauthenticated");
  }, [userId, authToken]);

  const checkSession = useCallback(async () => {
    if (!userId || !authToken) return;

    try {
      const response = await fetch("/api/auth/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token: authToken }),
      });

      if (!response.ok) {
        await logout();
        return;
      }

      const data = (await response.json()) as { user: UserDTO };
      setUser(data.user);
    } catch (err) {
      console.error("Session check error:", err);
    }
  }, [userId, authToken, logout]);

  const updateProfile = useCallback(
    async (displayName?: string, avatar?: string | null) => {
      if (!userId || !authToken) return false;

      setState("loading");
      setError(null);

      try {
        const response = await fetch("/api/auth/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            token: authToken,
            displayName,
            avatar,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          setError(errorData.error || "Profile update failed");
          setState("error");
          return false;
        }

        const data = (await response.json()) as { user: UserDTO };
        setUser(data.user);
        setState("authenticated");
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Profile update failed";
        setError(errorMsg);
        setState("error");
        return false;
      }
    },
    [userId, authToken],
  );

  return {
    state,
    user,
    userId,
    authToken,
    error,
    register,
    login,
    logout,
    checkSession,
    updateProfile,
  };
}
