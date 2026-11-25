import { normalisePhone } from "@keoshaa/core";
import { z } from "zod";

const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, { error: "admin.invalidId" });

export const organisationIdSchema = ulid;

const blank = z.string().trim();

export const organisationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "admin.nameRequired" })
    .max(200, { error: "admin.nameRequired" }),
  kind: z.enum(["school", "platform", "tutor_practice"]),
  province: blank.max(100),
  district: blank.max(100),
  municipality: blank.max(100),
  ward: blank.max(20),
  contact_phone: blank.refine((value) => value === "" || normalisePhone(value) !== null, {
    error: "admin.invalidPhone",
  }),
  pan_number: blank.refine((value) => value === "" || /^\d{9}$/.test(value), {
    error: "admin.invalidPan",
  }),
  vat_registered: z.boolean(),
});

export const organisationStatusSchema = z.object({
  status: z.enum(["active", "suspended", "closed"]),
});

export const memberAddSchema = z.object({
  user_id: ulid,
  role: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]{1,63}$/, { error: "admin.invalidRole" }),
  title: blank.max(80),
});

export const memberRemoveSchema = z.object({
  user_id: ulid,
});

export type OrganisationFormValues = z.infer<typeof organisationFormSchema>;
export type OrganisationStatusValues = z.infer<typeof organisationStatusSchema>;
export type MemberAddValues = z.infer<typeof memberAddSchema>;
export type MemberRemoveValues = z.infer<typeof memberRemoveSchema>;

export function organisationBody(values: OrganisationFormValues) {
  const address = {
    ...(values.province ? { province: values.province } : {}),
    ...(values.district ? { district: values.district } : {}),
    ...(values.municipality ? { municipality: values.municipality } : {}),
    ...(values.ward ? { ward: values.ward } : {}),
  };
  return {
    name: values.name,
    kind: values.kind,
    address: Object.keys(address).length === 0 ? null : address,
    contact_phone: values.contact_phone === "" ? null : normalisePhone(values.contact_phone),
    pan_number: values.pan_number === "" ? null : values.pan_number,
    vat_registered: values.vat_registered,
  };
}
