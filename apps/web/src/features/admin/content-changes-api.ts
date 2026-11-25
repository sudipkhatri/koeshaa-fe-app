"use client";

import type { components } from "@keoshaa/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { LIST_STALE_MS, requireData } from "./api";
import { contentKeys } from "./content-api";

type Change = components["schemas"]["ChangeRead"];
type Pagination =
  components["schemas"]["OffsetPagination"] | components["schemas"]["CursorPagination"] | null;

export interface ChangePage {
  items: Change[];
  total: number;
}

export type ChangeStatusFilter = "waiting" | "approved" | "rejected" | "applied" | "any";
export type ChangeKindFilter = "chapter" | "topic" | "concept" | "question" | "any";

function readPage(
  body: { data: Change[]; meta?: { pagination?: Pagination } } | undefined,
): ChangePage {
  const envelope = requireData(body ? { data: body } : undefined);
  const pagination = envelope.meta?.pagination;
  const total = pagination && "total" in pagination ? pagination.total : envelope.data.length;
  return { items: envelope.data, total };
}

export const changeKeys = {
  list: (status: string, kind: string, limit: number, offset: number) =>
    ["admin", "content", "changes", status, kind, limit, offset] as const,
};

export function useChanges(
  status: ChangeStatusFilter,
  kind: ChangeKindFilter,
  limit: number,
  offset: number,
) {
  return useQuery({
    queryKey: changeKeys.list(status, kind, limit, offset),
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<ChangePage> => {
      const { data } = await api.GET("/api/v1/content/changes", {
        params: {
          query: {
            ...(status === "any" ? {} : { status }),
            ...(kind === "any" ? {} : { entity_type: kind }),
            limit,
            offset,
          },
        },
      });
      return readPage(data);
    },
  });
}

export function useDecideChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      changeId,
      decision,
      notes,
    }: {
      changeId: string;
      decision: "approved" | "rejected";
      notes?: string | null;
    }) => {
      const { data } = await api.POST("/api/v1/content/changes/{change_id}/decision", {
        params: { path: { change_id: changeId } },
        body: { decision, notes: notes ?? null },
      });
      return requireData(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "content", "changes"] });
      void queryClient.invalidateQueries({ queryKey: contentKeys.waiting });
    },
  });
}

export function changeTone(status: string): "reward" | "success" | "danger" | "quiet" {
  const value = status.toLowerCase();
  if (value === "waiting") return "reward";
  if (value === "approved" || value === "applied") return "success";
  if (value === "rejected") return "danger";
  return "quiet";
}

export function proposedLines(proposed: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(proposed).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
}

export type { Change };
