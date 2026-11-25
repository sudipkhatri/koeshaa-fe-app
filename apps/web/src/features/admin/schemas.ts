import { z } from "zod";

const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, { error: "admin.invalidId" });
const optionalUlid = z.union([z.literal(""), ulid]);

export const leadIdSchema = ulid;

export const leadUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "won", "lost"]),
  assigned_to: optionalUlid,
});

export const settingKeySchema = z.string().trim().min(1).max(128);

export function settingValueSchema(minimum: number, maximum: number) {
  return z.object({
    value: z
      .number({ error: "admin.valueRequired" })
      .int({ error: "admin.valueRequired" })
      .min(minimum, { error: "admin.valueOutOfRange" })
      .max(maximum, { error: "admin.valueOutOfRange" }),
  });
}

const httpUrl = z
  .string()
  .trim()
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    },
    { error: "admin.invalidUrl" },
  );

export const webhookCreateSchema = z.object({
  name: z.string().trim().min(1, { error: "admin.nameRequired" }).max(100),
  url: httpUrl,
  format: z.enum(["generic", "slack", "teams"]),
  events: z.string().trim().min(1, { error: "admin.eventsRequired" }),
});

export const sitePageSchema = z.object({
  slug: z.enum(["about", "terms", "privacy"]),
  locale: z.enum(["en", "ne"]),
  version: z.string().trim().min(1, { error: "admin.versionRequired" }).max(40),
  title: z.string().trim().min(1, { error: "admin.titleRequired" }).max(200),
  body: z.string().trim().min(1, { error: "admin.bodyRequired" }),
});

export type LeadUpdateValues = z.infer<typeof leadUpdateSchema>;
export type WebhookCreateValues = z.infer<typeof webhookCreateSchema>;
export type SitePageValues = z.infer<typeof sitePageSchema>;

export function eventNames(value: string): string[] {
  return value
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}
