/**
 * The sign-in box takes a phone, email or username (spec ACC-7.1). These rules mirror the
 * backend (`app/domains/auth/identifiers.py`, `app/domains/users/normalize.py`) so the app can
 * show the right keyboard and errors before a request; the backend stays the authority.
 */

export type IdentifierKind = "phone" | "email" | "username";

const NEPAL_MOBILE = /^9[678]\d{8}$/;
const EMAIL = /^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/;
const USERNAME = /^[a-z0-9][a-z0-9._]{2,29}$/;
const PHONE_LIKE = /^[+\d][\d\s\-()]{6,}$/;

export function detectIdentifier(raw: string): IdentifierKind {
  const text = raw.trim();
  if (text.includes("@")) return "email";
  if (PHONE_LIKE.test(text)) return "phone";
  return "username";
}

/** `98XXXXXXXX`, `+977 98X XXX XXXX`, `098…` → `+97798XXXXXXXX`, or null when not a Nepal mobile. */
export function normalisePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("977")) digits = digits.slice(3);
  digits = digits.replace(/^0+/, "");
  return NEPAL_MOBILE.test(digits) ? `+977${digits}` : null;
}

/** The normalised identifier, or null when it is not valid for its kind. */
export function normaliseIdentifier(raw: string): { kind: IdentifierKind; value: string } | null {
  const kind = detectIdentifier(raw);
  const text = raw.trim();
  if (kind === "phone") {
    const value = normalisePhone(text);
    return value ? { kind, value } : null;
  }
  const value = text.toLowerCase();
  if (kind === "email") return EMAIL.test(value) && value.length <= 320 ? { kind, value } : null;
  return USERNAME.test(value) ? { kind, value } : null;
}
