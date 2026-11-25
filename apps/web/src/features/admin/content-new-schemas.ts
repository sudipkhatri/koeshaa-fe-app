import { z } from "zod";

export const questionSchema = z
  .object({
    kind: z.enum(["single", "multi", "blank", "answer_reason", "written", "numerical"]),
    source: z.enum(["book", "past_paper", "authored"]),
    language: z.enum(["en", "ne"]),
    marks: z
      .string()
      .trim()
      .refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) <= 100), {
        error: "admin.marksRequired",
      }),
    stem: z.string().trim().min(1, { error: "admin.stemRequired" }).max(2000),
    explanation: z.string().trim().max(2000),
    answer: z.string().trim().max(2000),
    reason: z.string().trim().max(2000),
  })
  .superRefine((value, context) => {
    const needsAnswer = value.kind !== "single" && value.kind !== "multi";
    if (needsAnswer && value.answer === "") {
      context.addIssue({ code: "custom", path: ["answer"], message: "admin.answerRequired" });
    }
    if (value.kind === "answer_reason" && value.reason === "") {
      context.addIssue({ code: "custom", path: ["reason"], message: "admin.reasonRequired" });
    }
  });

export type QuestionValues = z.infer<typeof questionSchema>;

export const chapterSchema = z.object({
  number: z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 99, {
      error: "admin.numberRequired",
    }),
  name: z.string().trim().min(1, { error: "admin.nameRequired" }).max(120),
});

export const topicSchema = z.object({
  number: z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 99, {
      error: "admin.numberRequired",
    }),
  name: z.string().trim().min(1, { error: "admin.nameRequired" }).max(120),
  slug: z
    .string()
    .trim()
    .min(1, { error: "admin.slugRequired" })
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { error: "admin.slugRequired" }),
  question: z.string().trim().min(1, { error: "admin.stemRequired" }).max(300),
  overview: z.string().trim().min(1, { error: "admin.overviewRequired" }).max(500),
});

export const ideaSchema = z.object({
  title: z.string().trim().min(1, { error: "admin.nameRequired" }).max(160),
});

export type ChapterValues = z.infer<typeof chapterSchema>;
export type TopicValues = z.infer<typeof topicSchema>;
export type IdeaValues = z.infer<typeof ideaSchema>;
