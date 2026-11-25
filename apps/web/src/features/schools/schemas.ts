import { normalisePhone } from "@keoshaa/core";
import { z } from "zod";

const visible = z
  .string()
  .trim()
  .regex(/^[^\u0000-\u001f\u007f]+$/u, { error: "admin.nameRequired" });

export const publicLeadSchema = z.object({
  contact_name: visible
    .min(1, { error: "admin.nameRequired" })
    .max(120, { error: "admin.nameRequired" }),
  school_name: visible
    .min(1, { error: "admin.nameRequired" })
    .max(200, { error: "admin.nameRequired" }),
  phone: z
    .string()
    .trim()
    .min(1, { error: "admin.invalidPhone" })
    .refine((value) => normalisePhone(value) !== null, { error: "admin.invalidPhone" }),
  message: z.string().max(2000, { error: "admin.nameRequired" }),
  website: z.string().max(200),
});

export type PublicLeadValues = z.infer<typeof publicLeadSchema>;
