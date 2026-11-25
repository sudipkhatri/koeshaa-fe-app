import { normalisePhone } from "@keoshaa/core";
import { z } from "zod";

export const organisationIdSchema = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, { error: "school.notFoundTitle" });

const blank = z.string().trim();

export const schoolDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "school.nameRequired" })
    .max(200, { error: "school.nameRequired" }),
  province: blank.max(100),
  district: blank.max(100),
  municipality: blank.max(100),
  ward: blank.max(20),
  contact_phone: blank.refine((value) => value === "" || normalisePhone(value) !== null, {
    error: "school.invalidPhone",
  }),
  pan_number: blank.refine((value) => value === "" || /^\d{9}$/.test(value), {
    error: "school.invalidPan",
  }),
  vat_registered: z.boolean(),
});

export type SchoolDetailsValues = z.infer<typeof schoolDetailsSchema>;

export function schoolDetailsBody(values: SchoolDetailsValues) {
  const address = {
    ...(values.province ? { province: values.province } : {}),
    ...(values.district ? { district: values.district } : {}),
    ...(values.municipality ? { municipality: values.municipality } : {}),
    ...(values.ward ? { ward: values.ward } : {}),
  };
  return {
    name: values.name,
    address: Object.keys(address).length === 0 ? null : address,
    contact_phone: values.contact_phone === "" ? null : normalisePhone(values.contact_phone),
    pan_number: values.pan_number === "" ? null : values.pan_number,
    vat_registered: values.vat_registered,
  };
}
