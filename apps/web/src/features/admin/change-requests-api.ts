"use client";

import type { components } from "@keoshaa/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { LIST_STALE_MS, requireData } from "./api";

type ChangeRequest = components["schemas"]["ChangeRequestRead"];
type ChangeType = components["schemas"]["ChangeType"];
type ReasonCode = components["schemas"]["ReasonCode"];
type Pagination =
  components["schemas"]["OffsetPagination"] | components["schemas"]["CursorPagination"] | null;

export type RequestStatusFilter = "submitted" | "approved" | "refused" | "any";

export interface RequestPage {
  items: ChangeRequest[];
  total: number;
}

export interface ProposedFields {
  gradeLevelId: string | null;
  streamId: string | null;
  optionalIds: string[];
}

function readPage(
  body: { data: ChangeRequest[]; meta?: { pagination?: Pagination } } | undefined,
): RequestPage {
  const envelope = requireData(body ? { data: body } : undefined);
  const pagination = envelope.meta?.pagination;
  const total = pagination && "total" in pagination ? pagination.total : envelope.data.length;
  return { items: envelope.data, total };
}

export const changeRequestKeys = {
  list: (status: string, limit: number, offset: number) =>
    ["admin", "change-requests", "list", status, limit, offset] as const,
  submittedCount: ["admin", "change-requests", "submitted", "count"] as const,
};

export function useChangeRequests(status: RequestStatusFilter, limit: number, offset: number) {
  return useQuery({
    queryKey: changeRequestKeys.list(status, limit, offset),
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<RequestPage> => {
      const { data } = await api.GET("/api/v1/enrollment/change-requests", {
        params: {
          query: {
            ...(status === "any" ? {} : { status }),
            limit,
            offset,
          },
        },
      });
      return readPage(data);
    },
  });
}

export function useDecideChangeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      decision,
      note,
    }: {
      requestId: string;
      decision: "approved" | "refused";
      note?: string | null;
    }) => {
      const { data } = await api.POST("/api/v1/enrollment/change-requests/{request_id}/decision", {
        params: { path: { request_id: requestId } },
        body: { decision, note: note ?? null },
      });
      return requireData(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "change-requests"] });
    },
  });
}

export function requestTone(status: string): "reward" | "success" | "danger" | "quiet" {
  if (status === "submitted") return "reward";
  if (status === "approved") return "success";
  if (status === "refused") return "danger";
  return "quiet";
}

export function proposedFields(proposed: Record<string, unknown>): ProposedFields {
  const grade = proposed.grade_level_id;
  const stream = proposed.stream_id;
  const optionals = proposed.optional_subject_ids;
  return {
    gradeLevelId: typeof grade === "string" ? grade : null,
    streamId: typeof stream === "string" ? stream : null,
    optionalIds: Array.isArray(optionals)
      ? optionals.filter((id): id is string => typeof id === "string")
      : [],
  };
}

export function isChangeType(value: string): value is ChangeType {
  return value === "change_class" || value === "change_stream" || value === "change_optionals";
}

export function isReasonCode(value: string): value is ReasonCode {
  return (
    value === "wrong_class" ||
    value === "wrong_stream" ||
    value === "wrong_optionals" ||
    value === "school_change" ||
    value === "other"
  );
}

export function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export type { ChangeRequest, ChangeType, ReasonCode };
