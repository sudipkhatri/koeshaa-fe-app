import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApiClient } from "@keoshaa/api-client";

import { useApi } from "@/features/session/use-api";
import type { StreamId } from "@/features/session/mock";
import { keys } from "@/lib/query";

import { loadGrades } from "./api";

export type ChangeRequestType = "change_class" | "change_stream" | "change_optionals";
export type ChangeReasonCode =
  "wrong_class" | "wrong_stream" | "wrong_optionals" | "school_change" | "other";

export interface SubmitChangeRequestInput {
  enrollmentId: string;
  type: ChangeRequestType;
  reasonCode: ChangeReasonCode;
  reasonText?: string;
  grade?: number;
  stream?: StreamId | null;
  optionalSubjectIds?: string[];
}

async function streamIdFor(
  api: ApiClient,
  grade: string,
  stream: StreamId,
): Promise<string | null> {
  const { data } = await api.GET("/api/v1/catalog/grade-levels/{grade}/pool", {
    params: { path: { grade }, query: { stream } },
  });
  return data?.data.stream_id ?? null;
}

/** After the self-serve window closes: ask staff via change-requests. */
export function useSubmitChangeRequest() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitChangeRequestInput) => {
      if (!api) return;
      const code = input.grade ? `c${input.grade}` : null;
      const grades = code ? await loadGrades(api) : [];
      const gradeId = code ? (grades.find((g) => g.code === code)?.id ?? null) : null;
      const streamId = input.stream && code ? await streamIdFor(api, code, input.stream) : null;
      await api.POST("/api/v1/me/enrollments/{enrollment_id}/change-requests", {
        params: { path: { enrollment_id: input.enrollmentId } },
        body: {
          type: input.type,
          reason_code: input.reasonCode,
          reason_text: input.reasonText ?? null,
          proposed: {
            grade_level_id: gradeId,
            stream_id: streamId,
            optional_subject_ids: input.optionalSubjectIds ?? null,
          },
        },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.enrollments }),
  });
}
