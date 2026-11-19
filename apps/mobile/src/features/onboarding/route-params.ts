import { z } from "zod";

import { routeParam } from "@/features/shared/route-params";

import type { CodeNext } from "./CodeScreen";

const codeNext: readonly CodeNext[] = ["signed-in", "reset", "signup"];

/** Only a masked destination (`a•••@x.com`, `98••••21`) may be shown; anything else is dropped. */
const maskedSchema = z.string().max(80).regex(/[•*]/);

const codeParamsSchema = z.object({
  to: routeParam(maskedSchema.optional().catch(undefined)),
  child: routeParam(z.enum(["0", "1"]).optional().catch(undefined)),
  next: routeParam(z.enum(codeNext as [CodeNext, ...CodeNext[]])),
});

export interface CodeParams {
  to: string;
  toParent: boolean;
  next: CodeNext;
}

/** `null` when the link is not a real step of the flow: send the person back to the start. */
export function parseCodeParams(raw: Record<string, unknown>): CodeParams | null {
  const parsed = codeParamsSchema.safeParse(raw);
  if (!parsed.success) return null;
  return { to: parsed.data.to ?? "", toParent: parsed.data.child === "1", next: parsed.data.next };
}

const gradeSchema = routeParam(z.enum(["11", "12"]).catch("11"));

/** Streams exist from Class 11; anything else falls back to 11. */
export function parseStreamGrade(raw: unknown): 11 | 12 {
  return gradeSchema.parse(raw) === "12" ? 12 : 11;
}
