"use client";

import type { components } from "@keoshaa/api-client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { cursorPage, LIST_STALE_MS } from "./api";

type LeadStatus = components["schemas"]["LeadStatus"];

/** One page of school leads, for the paged table. */
export function useSchoolLeadsPage(
  status: LeadStatus | null,
  limit: number,
  cursor: string | null,
) {
  return useQuery({
    queryKey: ["admin", "school-leads", "page", status, limit, cursor],
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/admin/school-leads", {
        params: {
          query: {
            limit,
            ...(cursor ? { cursor } : {}),
            ...(status ? { status } : {}),
          },
        },
      });
      return cursorPage(data);
    },
  });
}
