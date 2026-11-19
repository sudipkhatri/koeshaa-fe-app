import { kindOf, maskContact } from "./rules";
import type { ContactKind } from "./rules";

/** Demo rules standing in for the auth backend (replaced later): password, code and special users. */
export const DEMO_PASSWORD = "keoshaa123";
export const DEMO_CODE = "123456";
export const KNOWN_DEVICE_USER = "sita";
export const CODE_LENGTH = 6;
export const CODE_TRIES = 3;
export const RESEND_SECONDS = 30;

export type SignInOutcome =
  | { status: "missing" }
  | { status: "wrong" }
  | { status: "signedIn" }
  | { status: "needsCode"; maskedTo: string; toParent: boolean };

export function checkSignIn(id: string, password: string): SignInOutcome {
  if (!id.trim() || !password) return { status: "missing" };
  if (password !== DEMO_PASSWORD) return { status: "wrong" };
  if (id.trim().toLowerCase() === KNOWN_DEVICE_USER) return { status: "signedIn" };
  const kind: ContactKind = kindOf(id);
  return { status: "needsCode", maskedTo: maskContact(id, kind), toParent: kind === "user" };
}

export const isCorrectCode = (code: string) => code === DEMO_CODE;
