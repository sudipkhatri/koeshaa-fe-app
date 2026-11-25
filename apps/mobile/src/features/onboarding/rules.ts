export type ContactKind = "email" | "phone" | "user" | "";

export function kindOf(raw: string): ContactKind {
  const value = raw.trim();
  if (!value) return "";
  if (value.includes("@")) return "email";
  if (/^\+?[\d\s-]{6,}$/.test(value)) return "phone";
  return "user";
}

const MASKED = /[•*]/;

/**
 * Prefer the destination the API already masked. A raw address is never shown:
 * the local mask is used instead.
 */
export function displayDestination(server: string, fallback: string): string {
  const value = server.trim();
  return value.length > 0 && value.length <= 80 && MASKED.test(value) ? value : fallback;
}

/** "a•••@x.com" or "+977 98••••21" so the code destination is shown without exposing it. */
export function maskContact(raw: string, kind: ContactKind): string {
  const value = raw.trim();
  if (kind === "email") return `${value[0] ?? ""}•••${value.slice(value.indexOf("@"))}`;
  const digits = value.replace(/\D/g, "").slice(-10);
  return `+977 ${digits.slice(0, 2)}••••${digits.slice(-2)}`;
}

export const MIN_PASSWORD_LENGTH = 8;

/** 0 for empty, then 1 (weak) to 3 (strong). */
export function passwordScore(value: string): 0 | 1 | 2 | 3 {
  if (!value) return 0;
  let score = 0;
  if (value.length >= MIN_PASSWORD_LENGTH) score++;
  if (/[a-z]/.test(value) && /[A-Z0-9]/.test(value)) score++;
  if (value.length >= 12 || /[^a-zA-Z0-9]/.test(value)) score++;
  if (value.length < MIN_PASSWORD_LENGTH) return 1;
  return Math.max(score, 1) as 1 | 2 | 3;
}

export const UNDER_AGE = 13;

export function ageFrom(year: number, month: number, day: number, now = new Date()): number {
  const birthdayPassed =
    now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day);
  return now.getFullYear() - year - (birthdayPassed ? 0 : 1);
}
