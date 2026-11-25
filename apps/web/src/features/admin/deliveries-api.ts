"use client";

import type { components } from "@keoshaa/api-client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { cursorPage, LIST_STALE_MS } from "./api";

type DeliveryStatus = components["schemas"]["DeliveryStatus"];
type Channel = components["schemas"]["Channel"];

/** One page of the delivery log, for the paged table. */
export function useDeliveriesPage(
  status: DeliveryStatus | null,
  channel: Channel | null,
  limit: number,
  cursor: string | null,
) {
  return useQuery({
    queryKey: ["admin", "deliveries", "page", status, channel, limit, cursor] as const,
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/notifications/admin/deliveries", {
        params: {
          query: {
            limit,
            ...(cursor ? { cursor } : {}),
            ...(status ? { status } : {}),
            ...(channel ? { channel } : {}),
          },
        },
      });
      return cursorPage(data);
    },
  });
}
