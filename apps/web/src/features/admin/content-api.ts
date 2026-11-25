"use client";

import type { components } from "@keoshaa/api-client";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { LIST_STALE_MS, requireData } from "./api";

type Course = components["schemas"]["CourseRead"];
type Release = components["schemas"]["ReleaseRead"];
type Pagination =
  components["schemas"]["OffsetPagination"] | components["schemas"]["CursorPagination"] | null;

export interface CoursePage {
  items: Course[];
  total: number;
}

function readPage<T>(body: { data: T[]; meta?: { pagination?: Pagination } } | undefined): {
  items: T[];
  total: number;
} {
  const envelope = requireData(body ? { data: body } : undefined);
  const pagination = envelope.meta?.pagination;
  const total = pagination && "total" in pagination ? pagination.total : envelope.data.length;
  return { items: envelope.data, total };
}

export const contentKeys = {
  courses: (yearId: string, limit: number, offset: number) =>
    ["admin", "content", "courses", yearId, limit, offset] as const,
  releases: (subjectId: string) => ["admin", "content", "releases", subjectId] as const,
  waiting: ["admin", "content", "changes", "waiting"] as const,
};

export function useCourses(yearId: string, limit: number, offset: number) {
  return useQuery({
    queryKey: contentKeys.courses(yearId, limit, offset),
    enabled: yearId !== "",
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<CoursePage> => {
      const { data } = await api.GET("/api/v1/content/courses", {
        params: { query: { academic_year_id: yearId, limit, offset } },
      });
      return readPage<Course>(data);
    },
  });
}

export function useSubjectReleases(subjectId: string) {
  return useQuery({
    queryKey: contentKeys.releases(subjectId),
    enabled: subjectId !== "",
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<Release[]> => {
      const found: Release[] = [];
      const limit = 100;
      for (let offset = 0; offset < 500; offset += limit) {
        const { data } = await api.GET("/api/v1/content/releases", {
          params: { query: { subject_id: subjectId, limit, offset } },
        });
        const page = readPage<Release>(data);
        found.push(...page.items);
        if (found.length >= page.total || page.items.length < limit) break;
      }
      return found;
    },
  });
}

/** Edits waiting for a decision. The changes list calls this status "waiting". */
export function useWaitingEdits() {
  return useQuery({
    queryKey: contentKeys.waiting,
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<number | null> => {
      const { data } = await api.GET("/api/v1/content/changes", {
        params: { query: { status: "waiting", limit: 1, offset: 0 } },
      });
      const page = readPage(data);
      const pagination = data?.meta?.pagination;
      return pagination && "total" in pagination ? pagination.total : page.total;
    },
  });
}

export function courseTone(status: string): "success" | "sky" | "quiet" {
  const value = status.toLowerCase();
  if (value === "live") return "success";
  if (value === "scheduled") return "sky";
  return "quiet";
}

export type { Course, Release };
