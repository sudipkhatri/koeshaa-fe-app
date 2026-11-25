"use client";

import type { components } from "@keoshaa/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { LIST_STALE_MS, requireData } from "./api";
import { contentKeys } from "./content-api";

type Release = components["schemas"]["ReleaseRead"];
type Course = components["schemas"]["CourseRead"];
type Pagination =
  components["schemas"]["OffsetPagination"] | components["schemas"]["CursorPagination"] | null;

function readPage<T>(body: { data: T[]; meta?: { pagination?: Pagination } } | undefined): {
  items: T[];
  total: number;
} {
  const envelope = requireData(body ? { data: body } : undefined);
  const pagination = envelope.meta?.pagination;
  const total = pagination && "total" in pagination ? pagination.total : envelope.data.length;
  return { items: envelope.data, total };
}

export const releaseKeys = {
  yearCourses: (yearId: string) => ["admin", "releases", "courses", yearId] as const,
};

/** Courses for one academic year, used to see which release a subject is pinned to. */
export function useYearCourses(yearId: string) {
  return useQuery({
    queryKey: releaseKeys.yearCourses(yearId),
    enabled: yearId !== "",
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<Course[]> => {
      const found: Course[] = [];
      const limit = 100;
      for (let offset = 0; offset < 500; offset += limit) {
        const { data } = await api.GET("/api/v1/content/courses", {
          params: { query: { academic_year_id: yearId, limit, offset } },
        });
        const page = readPage<Course>(data);
        found.push(...page.items);
        if (found.length >= page.total || page.items.length < limit) break;
      }
      return found;
    },
  });
}

export function useCreateRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["ReleaseCreate"]) => {
      const { data } = await api.POST("/api/v1/content/releases", { body });
      return requireData(data);
    },
    onSuccess: (_result, body) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "releases"] });
      void queryClient.invalidateQueries({ queryKey: contentKeys.releases(body.subject_id) });
    },
  });
}

export function usePublishRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ releaseId, subjectId }: { releaseId: string; subjectId: string }) => {
      const { data } = await api.POST("/api/v1/content/releases/{release_id}/publish", {
        params: { path: { release_id: releaseId } },
      });
      return { release: requireData(data), subjectId };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "releases"] });
      void queryClient.invalidateQueries({ queryKey: contentKeys.releases(result.subjectId) });
    },
  });
}

export function usePinCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      courseId,
      contentReleaseId,
    }: {
      courseId: string;
      contentReleaseId: string;
      subjectId: string;
    }) => {
      const { data } = await api.PUT("/api/v1/content/courses/{course_id}/release", {
        params: { path: { course_id: courseId } },
        body: { content_release_id: contentReleaseId },
      });
      return requireData(data);
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "releases", "courses"] });
      void queryClient.invalidateQueries({ queryKey: contentKeys.releases(variables.subjectId) });
      void queryClient.invalidateQueries({ queryKey: ["admin", "content", "courses"] });
    },
  });
}

export function openRelease(releases: Release[]): Release | undefined {
  return [...releases]
    .filter((release) => release.published_at === null)
    .sort((left, right) => right.version - left.version)[0];
}

export function nextVersion(releases: Release[]): number {
  if (releases.length === 0) return 1;
  return Math.max(...releases.map((release) => release.version)) + 1;
}

export type { Release, Course };
