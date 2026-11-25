"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { LIST_STALE_MS, requireData } from "./api";

const ROLE_STALE_MS = 5 * 60_000;

/** The first platform role of a user, for the account row (null when the user has none). */
export function usePrimaryRole(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "access", userId],
    enabled: Boolean(userId),
    staleTime: ROLE_STALE_MS,
    retry: false,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/rbac/users/{user_id}", {
        params: { path: { user_id: userId ?? "" } },
      });
      const access = requireData(data);
      return (
        access.roles.find((role) => role.scope_id === null)?.role ?? access.roles[0]?.role ?? null
      );
    },
  });
}

/** How many enrolment change requests are waiting for a decision. */
export function useSubmittedRequestCount() {
  return useQuery({
    queryKey: ["admin", "change-requests", "submitted", "count"],
    staleTime: LIST_STALE_MS,
    retry: false,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/enrollment/change-requests", {
        params: { query: { status: "submitted", limit: 1, offset: 0 } },
      });
      const body = requireData(data ? { data } : undefined);
      const pagination = body.meta?.pagination;
      if (pagination && "total" in pagination) return pagination.total;
      return body.data.length;
    },
  });
}

/** "super_admin" → "Super admin". */
export function roleLabel(role: string): string {
  const words = role.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toLocaleUpperCase() + words.slice(1);
}
