"use client";

import type { components } from "@keoshaa/api-client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { cursorPage, LIST_STALE_MS, requireData } from "./api";

type Duplicate = components["schemas"]["DuplicateRead"];
type DuplicateStatus = components["schemas"]["DuplicateStatus"];
type User = components["schemas"]["UserRead"];

export const duplicateKeys = {
  page: (limit: number, cursor: string | null) =>
    ["admin", "duplicates", "page", limit, cursor] as const,
  count: ["admin", "duplicates", "count"] as const,
};

export function useDuplicatesPage(limit: number, cursor: string | null) {
  return useQuery({
    queryKey: duplicateKeys.page(limit, cursor),
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/users/duplicates", {
        params: {
          query: {
            limit,
            ...(cursor ? { cursor } : {}),
          },
        },
      });
      return cursorPage(data);
    },
  });
}

export function useDecideDuplicate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      duplicateId,
      status,
    }: {
      duplicateId: string;
      status: Exclude<DuplicateStatus, "open">;
    }) => {
      const { data } = await api.POST("/api/v1/users/duplicates/{duplicate_id}/decision", {
        params: { path: { duplicate_id: duplicateId } },
        body: { status },
      });
      return requireData(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "duplicates"] });
    },
  });
}

/** Keys in matched_on that the server marked true, in a stable order for titles. */
export function matchedKeys(matchedOn: Record<string, boolean>): string[] {
  const preferred = ["name", "date_of_birth", "phone", "email", "username"];
  const truthy = Object.entries(matchedOn)
    .filter(([, hit]) => hit)
    .map(([key]) => key);
  const ordered = preferred.filter((key) => truthy.includes(key));
  const rest = truthy.filter((key) => !preferred.includes(key)).sort();
  return [...ordered, ...rest];
}

export function isMatched(matchedOn: Record<string, boolean>, key: string): boolean {
  return matchedOn[key] === true;
}

export function primaryIdentifier(user: User | undefined): { kind: string; value: string } | null {
  if (!user) return null;
  const order = ["phone", "email", "username"] as const;
  for (const kind of order) {
    const found = user.identifiers.find((item) => item.kind === kind);
    if (found) return { kind: found.kind, value: found.value };
  }
  const first = user.identifiers[0];
  return first ? { kind: first.kind, value: first.value } : null;
}

export type { Duplicate };
