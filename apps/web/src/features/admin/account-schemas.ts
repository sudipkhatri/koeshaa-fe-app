import { z } from "zod";

export const FIND_BY = ["phone", "email", "username", "google", "name"] as const;
export type FindBy = (typeof FIND_BY)[number];

export const accountCreateSchema = z.object({
  name: z.string().trim().min(1, { error: "admin.nameRequired" }).max(200),
  accountKind: z.enum(["member", "staff"]),
  identifierKind: z.enum(["phone", "email", "username"]),
  identifier: z.string().trim().min(1, { error: "admin.identifierRequired" }),
});

export type AccountCreateValues = z.infer<typeof accountCreateSchema>;

export const accountDetailsSchema = z.object({
  name: z.string().trim().min(1, { error: "admin.nameRequired" }).max(200),
  locale: z.string().trim().min(2).max(35),
  dateOfBirth: z.string().refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    error: "admin.invalidDate",
  }),
});

export type AccountDetailsValues = z.infer<typeof accountDetailsSchema>;

export const identifierAddSchema = z.object({
  kind: z.enum(["phone", "email", "username", "google"]),
  value: z.string().trim().min(1, { error: "admin.identifierRequired" }),
});

export type IdentifierAddValues = z.infer<typeof identifierAddSchema>;

export const consentSchema = z.object({
  document: z.enum(["terms", "privacy"]),
  version: z.string().trim().min(1, { error: "admin.versionRequired" }).max(40),
  givenBy: z.string().trim().max(40),
});

export type ConsentValues = z.infer<typeof consentSchema>;

export const PAUSE_REASONS = [
  "abuse",
  "chargeback",
  "school_request",
  "guardian_request",
  "other",
] as const;

export const pauseSchema = z.object({
  reason: z.enum(PAUSE_REASONS),
  note: z.string().trim().max(500),
});

export type PauseValues = z.infer<typeof pauseSchema>;
