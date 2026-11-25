import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "admin.invalidDate" });

export const subjectSchema = z
  .object({
    name: z.string().trim().min(1, { error: "admin.nameRequired" }).max(80),
    code: z.string().trim().min(1, { error: "admin.codeRequired" }).max(20),
    order: z
      .string()
      .trim()
      .regex(/^\d+$/, { error: "admin.orderRequired" })
      .refine(
        (value) => {
          const order = Number(value);
          return order >= 1 && order <= 999;
        },
        { error: "admin.orderRequired" },
      ),
    gradeId: z.string().min(1, { error: "admin.gradeRequired" }),
    streamId: z.string(),
    needsStream: z.boolean(),
  })
  .refine((value) => !value.needsStream || value.streamId.length > 0, {
    path: ["streamId"],
    error: "admin.streamRequired",
  });

export type SubjectValues = z.infer<typeof subjectSchema>;

export const availabilitySchema = z
  .object({
    status: z.enum(["available", "partial", "coming_soon"]),
    expectedOn: z.string(),
  })
  .refine((value) => value.expectedOn === "" || day.safeParse(value.expectedOn).success, {
    path: ["expectedOn"],
    error: "admin.invalidDate",
  });

export type AvailabilityValues = z.infer<typeof availabilitySchema>;
