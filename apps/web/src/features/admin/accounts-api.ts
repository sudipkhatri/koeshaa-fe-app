"use client";

import type { components } from "@keoshaa/api-client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import type { AccountCreateValues } from "./account-schemas";
import { cursorPage, LIST_STALE_MS, requireData } from "./api";

type AccountKind = components["schemas"]["AccountKind"];
type IdentifierKind = components["schemas"]["IdentifierKind"];

const accountsKey = ["admin", "accounts"] as const;

/** One page of accounts. A blank search lists the first page. */
export function useAccountsPage(
  accountKind: AccountKind | null,
  name: string | null,
  identifierKind: IdentifierKind | null,
  identifier: string | null,
  limit: number,
  cursor: string | null,
) {
  return useQuery({
    queryKey: [
      ...accountsKey,
      "page",
      accountKind,
      name,
      identifierKind,
      identifier,
      limit,
      cursor,
    ],
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/users", {
        params: {
          query: {
            limit,
            ...(cursor ? { cursor } : {}),
            ...(accountKind ? { account_kind: accountKind } : {}),
            ...(name ? { name } : {}),
            ...(identifierKind && identifier
              ? { identifier_kind: identifierKind, identifier }
              : {}),
          },
        },
      });
      return cursorPage(data);
    },
  });
}

/** How many open duplicates the first page holds. The list has no total. */
export function useOpenDuplicateCount() {
  return useQuery({
    queryKey: ["admin", "duplicates", "count"] as const,
    staleTime: LIST_STALE_MS,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/users/duplicates", {
        params: { query: { limit: 20 } },
      });
      const result = cursorPage(data);
      return { count: result.items.length, hasMore: result.nextCursor !== null };
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AccountCreateValues & { identifier: string; locale: string }) => {
      const { data } = await api.POST("/api/v1/users", {
        body: {
          account_kind: input.accountKind,
          name: input.name.trim(),
          identifiers: [{ kind: input.identifierKind, value: input.identifier, verified: false }],
          locale: input.locale,
        },
      });
      return requireData(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountsKey });
    },
  });
}
