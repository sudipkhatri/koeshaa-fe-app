import { z } from "zod";

import { normaliseIdentifier, normalisePhone } from "@keoshaa/core";

/** Someone locked out with no phone or email on the account (ACC-13.2). */
export const recoverySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "recovery.nameShort" })
    .max(120, { error: "recovery.nameLong" }),
  callbackPhone: z
    .string()
    .trim()
    .refine((value) => normalisePhone(value) !== null, { error: "identifier.invalid" }),
  knownIdentifier: z
    .string()
    .trim()
    .refine((value) => value === "" || normaliseIdentifier(value) !== null, {
      error: "identifier.invalid",
    }),
  note: z.string().trim().max(500, { error: "recovery.noteLong" }),
});

export type RecoveryValues = z.infer<typeof recoverySchema>;
