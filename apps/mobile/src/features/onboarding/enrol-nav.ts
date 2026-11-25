import { router } from "expo-router";

import type { DraftEnrollment } from "@/features/enrollment/api";
import type { StreamId } from "@/features/session/mock";

/** After a draft enrollment is created, go to optionals (if needed) or confirm. */
export function continueAfterDraft(
  draft: DraftEnrollment | null,
  fallback: { grade: number; stream: StreamId | null },
) {
  if (!draft) {
    router.replace("/home");
    return;
  }
  const params = {
    enrollmentId: draft.enrollmentId,
    grade: String(draft.grade),
    stream: draft.stream ?? "",
  };
  if (draft.pool.optionalRequired > 0) {
    router.push({ pathname: "/onboarding/pick-optionals", params });
    return;
  }
  router.push({ pathname: "/onboarding/enrol-confirm", params });
}

export function enrolConfirmParams(input: {
  enrollmentId: string;
  grade: number;
  stream: StreamId | null;
  deferred?: boolean;
  optionals?: string;
}) {
  return {
    enrollmentId: input.enrollmentId,
    grade: String(input.grade),
    stream: input.stream ?? "",
    deferred: input.deferred ? "1" : "0",
    optionals: input.optionals ?? "",
  };
}
