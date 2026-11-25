"use client";

import type { components } from "@keoshaa/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { LIST_STALE_MS, requireData } from "./api";
import type { YearValues } from "./curriculum-schemas";

type Year = components["schemas"]["AcademicYearRead"];
type Grade = components["schemas"]["GradeLevelRead"];
type Stream = components["schemas"]["StreamRead"];

const CATALOG_STALE_MS = 60_000;

export const curriculumKeys = {
  years: ["admin", "curriculum", "years"] as const,
  grades: ["admin", "curriculum", "grades"] as const,
  streams: ["admin", "curriculum", "streams"] as const,
};

export type YearPlace = "current" | "next" | "past";

/** Current comes from the API. Next and Past are worked out from the dates. */
export function yearPlace(year: Pick<Year, "is_current" | "ends_on">, today: string): YearPlace {
  if (year.is_current) return "current";
  if (year.ends_on < today) return "past";
  return "next";
}

export function orderedYears(years: Year[]): Year[] {
  return [...years].sort((left, right) => {
    if (left.is_current !== right.is_current) return left.is_current ? -1 : 1;
    return right.starts_on.localeCompare(left.starts_on);
  });
}

function refreshYears(queryClient: ReturnType<typeof useQueryClient>) {
  return () => {
    void queryClient.invalidateQueries({ queryKey: curriculumKeys.years });
  };
}

export function useAcademicYears() {
  return useQuery({
    queryKey: curriculumKeys.years,
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<Year[]> => {
      const { data } = await api.GET("/api/v1/curriculum/academic-years");
      return requireData(data);
    },
  });
}

export function useGradeLevels() {
  return useQuery({
    queryKey: curriculumKeys.grades,
    staleTime: CATALOG_STALE_MS,
    queryFn: async (): Promise<Grade[]> => {
      const { data } = await api.GET("/api/v1/curriculum/grade-levels");
      return requireData(data);
    },
  });
}

export function useStreams() {
  return useQuery({
    queryKey: curriculumKeys.streams,
    staleTime: CATALOG_STALE_MS,
    queryFn: async (): Promise<Stream[]> => {
      const { data } = await api.GET("/api/v1/curriculum/streams");
      return requireData(data);
    },
  });
}

export function useCreateYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: YearValues) => {
      const { data } = await api.POST("/api/v1/curriculum/academic-years", {
        body: {
          label: values.label.trim(),
          starts_on: values.startsOn,
          ends_on: values.endsOn,
          is_current: false,
        },
      });
      return requireData(data);
    },
    onSuccess: refreshYears(queryClient),
  });
}

export function useUpdateYear(yearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: YearValues) => {
      const { data } = await api.PATCH("/api/v1/curriculum/academic-years/{year_id}", {
        params: { path: { year_id: yearId } },
        body: {
          label: values.label.trim(),
          starts_on: values.startsOn,
          ends_on: values.endsOn,
        },
      });
      return requireData(data);
    },
    onSuccess: refreshYears(queryClient),
  });
}

export function useMakeCurrentYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (yearId: string) => {
      const { data } = await api.POST("/api/v1/curriculum/academic-years/{year_id}/current", {
        params: { path: { year_id: yearId } },
      });
      return requireData(data);
    },
    onSuccess: refreshYears(queryClient),
  });
}
