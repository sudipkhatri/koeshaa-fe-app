"use client";

import type { components } from "@keoshaa/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { LIST_STALE_MS, requireData } from "./api";
import type { AvailabilityValues, SubjectValues } from "./subject-schemas";

type Subject = components["schemas"]["SubjectRead"];
type Availability = components["schemas"]["AvailabilityRead"];
type PoolVersion = components["schemas"]["PoolVersionRead"];
type Pagination =
  components["schemas"]["OffsetPagination"] | components["schemas"]["CursorPagination"] | null;

interface Listed<T> {
  data: T[];
  meta?: { pagination?: Pagination };
}

const PAGE_CAP = 500;

export const subjectKeys = {
  list: (grade: string, stream: string, limit: number, offset: number) =>
    ["admin", "subjects", "list", grade, stream, limit, offset] as const,
  catalog: (grade: string, stream: string) =>
    ["admin", "subjects", "catalog", grade, stream] as const,
  availability: (grade: string) => ["admin", "subjects", "availability", grade] as const,
};

export interface SubjectPage {
  items: Subject[];
  total: number;
}

function readPage<T>(body: Listed<T> | undefined): { items: T[]; total: number } {
  const envelope = requireData(body ? { data: body } : undefined);
  const pagination = envelope.meta?.pagination;
  const total = pagination && "total" in pagination ? pagination.total : envelope.data.length;
  return { items: envelope.data, total };
}

function subjectQuery(grade: string, stream: string, limit: number, offset: number) {
  return {
    limit,
    offset,
    ...(grade !== "all" ? { grade_level_id: grade } : {}),
    ...(stream !== "" && stream !== "all" ? { stream_id: stream } : {}),
  };
}

async function collectSubjects(grade: string, stream: string): Promise<Subject[]> {
  const found: Subject[] = [];
  const limit = 100;
  for (let offset = 0; offset < PAGE_CAP; offset += limit) {
    const { data } = await api.GET("/api/v1/curriculum/subjects", {
      params: { query: subjectQuery(grade, stream, limit, offset) },
    });
    const page = readPage<Subject>(data);
    found.push(...page.items);
    if (found.length >= page.total || page.items.length < limit) break;
  }
  return found;
}

export function useSubjects(grade: string, stream: string, limit: number, offset: number) {
  return useQuery({
    queryKey: subjectKeys.list(grade, stream, limit, offset),
    enabled: grade !== "",
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<SubjectPage> => {
      const { data } = await api.GET("/api/v1/curriculum/subjects", {
        params: { query: subjectQuery(grade, stream, limit, offset) },
      });
      return readPage<Subject>(data);
    },
  });
}

/** Every subject, so a course id can be shown with its name and grade. */
export function useSubjectDirectory() {
  return useQuery({
    queryKey: ["admin", "subjects", "directory"] as const,
    staleTime: LIST_STALE_MS,
    queryFn: () => collectSubjects("all", "all"),
  });
}

/** Every subject for one grade and stream, for the pool's names and add list. */
export function useSubjectCatalog(grade: string, stream: string) {
  return useQuery({
    queryKey: subjectKeys.catalog(grade, stream),
    enabled: grade !== "" && grade !== "all",
    staleTime: LIST_STALE_MS,
    queryFn: () => collectSubjects(grade, stream),
  });
}

export function useAvailability(grade: string) {
  return useQuery({
    queryKey: subjectKeys.availability(grade),
    enabled: grade !== "",
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<Availability[]> => {
      const { data } = await api.GET("/api/v1/curriculum/availability", {
        params: { query: grade === "all" ? {} : { grade_level_id: grade } },
      });
      return readPage<Availability>(data).items;
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: SubjectValues): Promise<Subject> => {
      const { data } = await api.POST("/api/v1/curriculum/subjects", {
        body: {
          grade_level_id: values.gradeId,
          stream_id: values.streamId || null,
          code: values.code.trim(),
          name: values.name.trim(),
          curriculum_order: Number(values.order),
        },
      });
      return requireData(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "subjects", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "subjects", "catalog"] });
    },
  });
}

export function useSetAvailability(gradeId: string, subjectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: AvailabilityValues): Promise<Availability> => {
      const { data } = await api.PUT(
        "/api/v1/curriculum/availability/{grade_level_id}/{subject_id}",
        {
          params: { path: { grade_level_id: gradeId, subject_id: subjectId } },
          body: {
            status: values.status,
            expected_on: values.expectedOn || null,
          },
        },
      );
      return requireData(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "subjects", "availability"] });
    },
  });
}

export type { Availability, PoolVersion, Subject };
