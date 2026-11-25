import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/features/session/use-api";
import { keys } from "@/lib/query";

export interface AlertItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  url: string | null;
  readAt: string | null;
  createdAt: string;
}

const MOCK_ALERTS: AlertItem[] = [
  {
    id: "n1",
    kind: "guardian_request",
    title: "Sita Khadka wants to link to you",
    body: "She says she is your mother. Say yes or no — it expires in 5 days.",
    url: null,
    readAt: null,
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: "n2",
    kind: "subject_ready",
    title: "Biology is ready",
    body: "The first chapters arrived early.",
    url: null,
    readAt: null,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: "n3",
    kind: "new_device",
    title: "A new device signed in",
    body: "School tablet. If that was not you, change your password.",
    url: null,
    readAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 22 * 86_400_000).toISOString(),
  },
];

function mapAlert(row: {
  id: string;
  kind: string;
  title: string;
  body: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
}): AlertItem {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    url: row.url,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export function useAlerts() {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: keys.notifications,
    initialPageParam: null as string | null,
    staleTime: 15_000,
    queryFn: async ({ pageParam }) => {
      if (!api) {
        return { items: MOCK_ALERTS, nextCursor: null as string | null };
      }
      const { data } = await api.GET("/api/v1/notifications", {
        params: { query: { limit: 20, ...(pageParam ? { cursor: pageParam } : {}) } },
      });
      const pagination = data?.meta?.pagination;
      const nextCursor =
        pagination && "next_cursor" in pagination ? (pagination.next_cursor ?? null) : null;
      return {
        items: (data?.data ?? []).map(mapAlert),
        nextCursor,
      };
    },
    getNextPageParam: (page) => page.nextCursor,
  });
}

export function useUnreadCount() {
  const api = useApi();
  return useQuery({
    queryKey: keys.unreadCount,
    staleTime: 15_000,
    queryFn: async () => {
      if (!api) return MOCK_ALERTS.filter((a) => !a.readAt).length;
      const { data } = await api.GET("/api/v1/notifications/unread-count");
      return data?.data.unread ?? 0;
    },
  });
}

export function useMarkRead() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (api) {
        await api.POST("/api/v1/notifications/{notification_id}/read", {
          params: { path: { notification_id: id } },
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.notifications });
      void queryClient.invalidateQueries({ queryKey: keys.unreadCount });
    },
  });
}

export function useMarkAllRead() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (api) await api.POST("/api/v1/notifications/read-all");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.notifications });
      void queryClient.invalidateQueries({ queryKey: keys.unreadCount });
    },
  });
}
