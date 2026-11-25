import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiClient } from "@keoshaa/api-client";

import { phoneForApi } from "@/features/auth/identifier";
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
  yearLabel: string | null;
  windowOpen: boolean;
  changesLeft: number;
  windowEndsAt: string | null;
  state: "draft" | "confirmed" | "locked" | "ended" | null;
}

export interface PoolSubject {
  id: string;
  code: string;
  name: string;
  availability: "available" | "partial" | "coming_soon";
  expectedOn: string | null;
}

export interface SubjectPool {
  optionalRequired: number;
  compulsory: PoolSubject[];
  optional: PoolSubject[];
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

export async function loadPool(
  api: ApiClient,
  grade: number,
  stream: StreamId | null,
): Promise<SubjectPool> {
  const code = `c${grade}`;
  const { data } = await api.GET("/api/v1/catalog/grade-levels/{grade}/pool", {
    params: {
      path: { grade: code },
      query: stream ? { stream } : {},
    },
  });
  const pool = data?.data;
  const map = (row: {
    subject_id: string;
    code: string;
    name: string;
    availability: PoolSubject["availability"];
    expected_on: string | null;
  }): PoolSubject => ({
    id: row.subject_id,
    code: row.code,
    name: row.name,
    availability: row.availability,
    expectedOn: row.expected_on,
  });
  return {
    optionalRequired: pool?.optional_required ?? 0,
    compulsory: (pool?.compulsory ?? []).map(map),
    optional: (pool?.optional ?? []).map(map),
  };
}

async function loadClassInfo(api: ApiClient): Promise<ClassInfo | null> {
  const [{ data }, year] = await Promise.all([
    api.GET("/api/v1/me/enrollments"),
    api.GET("/api/v1/catalog/academic-years/current"),
  ]);
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
  const yearData = year.data?.data;
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
    yearLabel: yearData?.id === current.academic_year_id ? yearData.label : null,
    windowOpen: current.window_open,
    changesLeft: current.changes_left,
    windowEndsAt: current.window_ends_at,
    state: current.state,
  };
}

const MOCK_CLASS: ClassInfo = {
  enrollmentId: "mock-enr",
  grade: 7,
  stream: null,
  confirmed: true,
  subjects: [
    { code: "sci", name: "Science", optional: false },
    { code: "eng", name: "English", optional: false },
  ],
  yearLabel: "2083",
  windowOpen: true,
  changesLeft: 2,
  windowEndsAt: "2026-12-30T18:15:00+05:45",
  state: "confirmed",
};

const MOCK_POOL: SubjectPool = {
  optionalRequired: 2,
  compulsory: [
    { id: "c1", code: "phy", name: "Physics", availability: "available", expectedOn: null },
    { id: "c2", code: "che", name: "Chemistry", availability: "available", expectedOn: null },
    { id: "c3", code: "eng", name: "English", availability: "available", expectedOn: null },
  ],
  optional: [
    { id: "o1", code: "bio", name: "Biology", availability: "coming_soon", expectedOn: null },
    { id: "o2", code: "math", name: "Mathematics", availability: "available", expectedOn: null },
    {
      id: "o3",
      code: "cs",
      name: "Computer Science",
      availability: "available",
      expectedOn: null,
    },
  ],
};

/** The student's class this year; `null` data means no class has been picked yet. */
export function useClassInfo() {
  const api = useApi();
  return useQuery({
    queryKey: keys.enrollments,
    staleTime: 5 * 60_000,
    queryFn: () => (api ? loadClassInfo(api) : Promise.resolve(MOCK_CLASS)),
  });
}

export function useSubjectPool(grade: number, stream: StreamId | null, enabled: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: keys.pool(`c${grade}`, stream),
    enabled: enabled && grade > 0,
    staleTime: 5 * 60_000,
    queryFn: () => (api ? loadPool(api, grade, stream) : Promise.resolve(MOCK_POOL)),
  });
}

export interface PickClassInput {
  grade: number;
  stream: StreamId | null;
}

export interface DraftEnrollment {
  enrollmentId: string;
  grade: number;
  stream: StreamId | null;
  pool: SubjectPool;
}

/**
 * Creates or updates a draft enrollment (stream set). Does not confirm.
 * Already-confirmed enrollments use the corrections endpoint and return null draft.
 */
export function useStartEnrollment() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ grade, stream }: PickClassInput): Promise<DraftEnrollment | null> => {
      if (!api) {
        const next: ClassInfo = {
          ...MOCK_CLASS,
          grade,
          stream,
          confirmed: false,
          enrollmentId: "draft-1",
        };
        queryClient.setQueryData(keys.enrollments, next);
        return { enrollmentId: "draft-1", grade, stream, pool: MOCK_POOL };
      }
      const code = `c${grade}`;
      const [year, grades, existing] = await Promise.all([
        api.GET("/api/v1/catalog/academic-years/current"),
        loadGrades(api),
        loadClassInfo(api),
      ]);
      const gradeId = grades.find((g) => g.code === code)?.id;
      if (!gradeId || !year.data) return null;
      const streamId = stream ? await streamIdFor(api, code, stream) : null;
      if (existing?.confirmed && existing.enrollmentId) {
        await api.POST("/api/v1/me/enrollments/{enrollment_id}/corrections", {
          params: { path: { enrollment_id: existing.enrollmentId } },
          body: { grade_level_id: gradeId, stream_id: streamId },
        });
        return null;
      }
      let enrollmentId = existing?.enrollmentId;
      if (!enrollmentId) {
        const created = await api.POST("/api/v1/me/enrollments", {
          body: { academic_year_id: year.data.data.id, grade_level_id: gradeId },
        });
        enrollmentId = created.data?.data.id;
      }
      if (!enrollmentId) return null;
      const pool = await loadPool(api, grade, stream);
      await api.PATCH("/api/v1/me/enrollments/{enrollment_id}", {
        params: { path: { enrollment_id: enrollmentId } },
        body: {
          stream_id: streamId,
          draft_step: pool.optionalRequired > 0 ? 3 : 4,
          optionals_deferred: pool.optionalRequired === 0 ? false : null,
        },
      });
      return { enrollmentId, grade, stream, pool };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.enrollments }),
  });
}

/** @deprecated Prefer useStartEnrollment + confirm. Kept for callers that still confirm in one step. */
export function usePickClass() {
  const start = useStartEnrollment();
  const confirm = useConfirmEnrollment();
  return useMutation({
    mutationFn: async (input: PickClassInput) => {
      const draft = await start.mutateAsync(input);
      if (!draft) return;
      await confirm.mutateAsync({
        enrollmentId: draft.enrollmentId,
        optionalsDeferred: true,
        optionalSubjectIds: [],
      });
    },
  });
}

export function useChooseOptionals() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      enrollmentId: string;
      optionalSubjectIds: string[];
      deferred: boolean;
    }) => {
      if (!api) return;
      if (input.deferred) {
        await api.PATCH("/api/v1/me/enrollments/{enrollment_id}", {
          params: { path: { enrollment_id: input.enrollmentId } },
          body: { optionals_deferred: true, draft_step: 4 },
        });
        return;
      }
      await api.POST("/api/v1/me/enrollments/{enrollment_id}/optionals", {
        params: { path: { enrollment_id: input.enrollmentId } },
        body: { optional_subject_ids: input.optionalSubjectIds },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.enrollments }),
  });
}

export function useConfirmEnrollment() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      enrollmentId: string;
      optionalsDeferred?: boolean;
      optionalSubjectIds?: string[];
      parentPhone?: string;
    }) => {
      if (!api) {
        queryClient.setQueryData<ClassInfo>(keys.enrollments, (prev) =>
          prev ? { ...prev, confirmed: true } : MOCK_CLASS,
        );
        return;
      }
      const path = { params: { path: { enrollment_id: input.enrollmentId } } };
      if (
        input.optionalsDeferred ||
        (input.optionalSubjectIds?.length ?? 0) > 0 ||
        input.parentPhone
      ) {
        await api.PATCH("/api/v1/me/enrollments/{enrollment_id}", {
          ...path,
          body: {
            ...(input.optionalsDeferred ? { optionals_deferred: true } : {}),
            ...(input.optionalSubjectIds?.length
              ? { optional_subject_ids: input.optionalSubjectIds }
              : {}),
            ...(input.parentPhone
              ? {
                  parent_contact: { kind: "phone" as const, value: phoneForApi(input.parentPhone) },
                }
              : {}),
            draft_step: 5,
          },
        });
      }
      await api.POST("/api/v1/me/enrollments/{enrollment_id}/confirm", path);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.enrollments }),
  });
}
