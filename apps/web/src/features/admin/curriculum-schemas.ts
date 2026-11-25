import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "admin.invalidDate" });

export const yearSchema = z
  .object({
    label: z.string().trim().min(1, { error: "admin.nameRequired" }).max(40),
    startsOn: day,
    endsOn: day,
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    path: ["endsOn"],
    error: "admin.endsBeforeStart",
  });

export type YearValues = z.infer<typeof yearSchema>;
