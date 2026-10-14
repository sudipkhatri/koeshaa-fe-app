import { z } from "zod";

import { normaliseIdentifier } from "./identifiers";

/** ACC-7.2: at least 8 characters, no other composition rules. Matches `AUTH_PASSWORD_MIN_LENGTH`. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: "password.tooShort" })
  .max(PASSWORD_MAX_LENGTH, { error: "password.tooLong" });

export const identifierSchema = z
  .string()
  .trim()
  .min(3, { error: "identifier.required" })
  .refine((value) => normaliseIdentifier(value) !== null, { error: "identifier.invalid" });

export const codeSchema = z.string().regex(/^\d{6}$/, { error: "code.invalid" });

export const signInSchema = z.object({ identifier: identifierSchema, password: passwordSchema });
export type SignInValues = z.infer<typeof signInSchema>;
