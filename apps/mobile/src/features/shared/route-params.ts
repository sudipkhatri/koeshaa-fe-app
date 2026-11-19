import { z } from "zod";

/** Expo Router gives `string | string[]` (repeated keys in a deep link); only the first counts. */
export const routeParam = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (Array.isArray(value) ? value[0] : value), schema);

/** A subject code from the catalog, e.g. `maths` or `science_technology`. */
export const subjectIdSchema = z.string().regex(/^[a-z0-9_-]{1,64}$/i);
const indexSchema = z
  .string()
  .regex(/^\d{1,3}$/)
  .transform(Number);

export const chapterRefSchema = z
  .string()
  .regex(/^[a-z0-9_-]{1,64}:\d{1,3}$/i)
  .transform((ref) => {
    const [subjectId = "", index = "0"] = ref.split(":");
    return { subjectId, index: Number(index) };
  });

export const contentRefSchema = z
  .string()
  .regex(/^[a-z0-9_-]{1,64}:\d{1,3}:\d{1,3}$/i)
  .transform((ref) => {
    const [subjectId = "", chapter = "0", topic = "0"] = ref.split(":");
    return { subjectId, chapter: indexSchema.parse(chapter), topic: indexSchema.parse(topic) };
  });
