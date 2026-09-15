import type { SessionDTO } from "./types";

const KEY = "nexus.session.v1";
const PREFS_KEY = "nexus.prefs.v1";

export type Prefs = {
  reduceMotion: boolean;
  compact: boolean;
  showTimestamps: boolean;
  sound: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  reduceMotion: false,
  compact: false,
  showTimestamps: true,
  sound: false,
};

export function loadSession(): SessionDTO | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionDTO;
    if (!parsed?.roomId || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: SessionDTO) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
