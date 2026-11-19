import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiClient } from "@keoshaa/api-client";

import { useApi } from "@/features/session/use-api";
import { keys } from "@/lib/query";
import { streamIds } from "@/features/session/mock";
import type { StreamId } from "@/features/session/mock";

export interface ClassSubject {
  code: string;
  name: string;
  optional: boolean;
}

export interface ClassInfo {
  enrollmentId: string | null;
  /** 1 to 12. */
  grade: number;
  stream: StreamId | null;
  confirmed: boolean;
  subjects: ClassSubject[];
}

const STREAM_FROM = 11;

export async function loadGrades(api: ApiClient) {
  const { data } = await api.GET("/api/v1/catalog/grade-levels");
  return data?.data ?? [];
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

async function loadClassInfo(api: ApiClient): Promise<ClassInfo | null> {
  const { data } = await api.GET("/api/v1/me/enrollments");
  const current = data?.data.current[0];
  if (!current) return null;
  const grades = await loadGrades(api);
  const code = grades.find((grade) => grade.id === current.grade_level_id)?.code ?? "";
  const grade = Number(code.replace(/^c/, ""));
  let stream: StreamId | null = null;
  if (current.stream_id && grade >= STREAM_FROM) {
    for (const candidate of streamIds) {
      if ((await streamIdFor(api, code, candidate)) === current.stream_id) {
        stream = candidate;
        break;
      }
    }
  }
  return {
    enrollmentId: current.id,
    grade: Number.isInteger(grade) ? grade : 0,
    stream,
    confirmed: current.state !== "draft",
    subjects: current.subjects.map((s) => ({
      code: s.code,
      name: s.name,
      optional: s.kind !== "compulsory",
    })),
  };
}

const MOCK_CLASS: ClassInfo = {
  enrollmentId: null,
  grade: 7,
  stream: null,
  confirmed: true,
  subjects: [],
};

/** The student's class this year; `null` data means no class has been picked yet. */
export function useClassInfo() {
  const api = useApi();
  return useQuery({
    queryKey: keys.enrollments,
    // The class changes rarely; reading it again on every screen would waste mobile data.
    staleTime: 5 * 60_000,
    queryFn: () => (api ? loadClassInfo(api) : Promise.resolve(MOCK_CLASS)),
  });
}

export interface PickClassInput {
  grade: number;
  stream: StreamId | null;
}

/** Creates, fills and confirms the year's enrollment, or corrects a confirmed one. */
export function usePickClass() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ grade, stream }: PickClassInput) => {
      if (!api) {
        const next: ClassInfo = { ...MOCK_CLASS, grade, stream };
        queryClient.setQueryData(keys.enrollments, next);
        return;
      }
      const code = `c${grade}`;
      const [year, grades, existing] = await Promise.all([
        api.GET("/api/v1/catalog/academic-years/current"),
        loadGrades(api),
        loadClassInfo(api),
      ]);
      const gradeId = grades.find((g) => g.code === code)?.id;
      if (!gradeId || !year.data) return;
      const streamId = stream ? await streamIdFor(api, code, stream) : null;
      if (existing?.confirmed && existing.enrollmentId) {
        await api.POST("/api/v1/me/enrollments/{enrollment_id}/corrections", {
          params: { path: { enrollment_id: existing.enrollmentId } },
          body: { grade_level_id: gradeId, stream_id: streamId },
        });
        return;
      }
      let enrollmentId = existing?.enrollmentId;
      if (!enrollmentId) {
        const created = await api.POST("/api/v1/me/enrollments", {
          body: { academic_year_id: year.data.data.id, grade_level_id: gradeId },
        });
        enrollmentId = created.data?.data.id;
      }
      if (!enrollmentId) return;
      const path = { params: { path: { enrollment_id: enrollmentId } } };
      await api.PATCH("/api/v1/me/enrollments/{enrollment_id}", {
        ...path,
        body: { stream_id: streamId, optionals_deferred: true, draft_step: 5 },
      });
      await api.POST("/api/v1/me/enrollments/{enrollment_id}/confirm", path);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.enrollments }),
  });
}
