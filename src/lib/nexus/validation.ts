export const LIMITS = {
  displayName: 24,
  roomName: 40,
  description: 140,
  message: 2000,
};

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Strips control characters (except newlines) and collapses excess whitespace. */
export function sanitizeText(input: string, maxLength: number, allowNewlines = false): string {
  let value = String(input ?? "");
  // eslint-disable-next-line no-control-regex
  value = value.replace(allowNewlines ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, "");
  if (allowNewlines) value = value.replace(/\n{4,}/g, "\n\n\n");
  value = value.replace(/[ \t]{3,}/g, "  ");
  return value.trim().slice(0, maxLength);
}

/** Normalizes any user-typed code into the canonical NXS-XXX-XXX form. */
export function normalizeCode(input: string): string | null {
  const raw = String(input ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("NXS") ? raw.slice(3) : raw;
  if (body.length !== 6) return null;
  if (![...body].every((c) => CODE_ALPHABET.includes(c))) return null;
  return `NXS-${body.slice(0, 3)}-${body.slice(3)}`;
}

/** Live formatting while the user types in the code field. */
export function formatCodeInput(input: string): string {
  const raw = String(input ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const body = (raw.startsWith("NXS") ? raw.slice(3) : raw).slice(0, 6);
  if (!body) return raw.startsWith("NXS") ? "NXS-" : "";
  if (body.length <= 3) return `NXS-${body}`;
  return `NXS-${body.slice(0, 3)}-${body.slice(3)}`;
}

export function generateCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const chars = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]);
  return `NXS-${chars.slice(0, 3).join("")}-${chars.slice(3).join("")}`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

/** Deterministic hue from a name, used for avatar gradients. */
export function hueOf(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  return 38 + (hash % 48); // warm gold -> amber band
}
