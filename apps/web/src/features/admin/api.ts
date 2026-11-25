"use client";

import { ApiError } from "@keoshaa/core";
import type { components } from "@keoshaa/api-client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import type { LeadUpdateValues } from "./schemas";
import { eventNames, type SitePageValues, type WebhookCreateValues } from "./schemas";

type Schemas = components["schemas"];
type LeadStatus = Schemas["LeadStatus"];
type DeliveryStatus = Schemas["DeliveryStatus"];
type Channel = Schemas["Channel"];
type SchoolLead = Schemas["SchoolLeadRead"];
type Setting = Schemas["SettingRead"];
type SettingChange = Schemas["SettingChangeRead"];
type Webhook = Schemas["WebhookRead"];
type WebhookCreated = Schemas["WebhookCreated"];
type Delivery = Schemas["DeliveryRead"];
type SitePage = Schemas["SitePageRead"];
type Pagination = Schemas["CursorPagination"] | Schemas["OffsetPagination"];

export const PAGE_LIMIT = 20;
export const LIST_STALE_MS = 15_000;
const SETTINGS_STALE_MS = 60_000;
const ACCOUNT_STALE_MS = 60_000;

export const adminKeys = {
  leads: (status: LeadStatus | null) => ["admin", "school-leads", status] as const,
  lead: (leadId: string) => ["admin", "school-lead", leadId] as const,
  settings: ["admin", "settings"] as const,
  settingHistory: (key: string) => ["admin", "settings", key, "history"] as const,
  webhooks: ["admin", "webhooks"] as const,
  deliveries: (status: DeliveryStatus | null, channel: Channel | null) =>
    ["admin", "deliveries", status, channel] as const,
};

interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export function requireData<T>(body: { data: T } | undefined): T {
  if (!body) throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
  return body.data;
}

function nextCursor(pagination: Pagination | null | undefined): string | null {
  if (!pagination || !("next_cursor" in pagination)) return null;
  return pagination.next_cursor ?? null;
}

export function cursorPage<T>(
  body: { data: T[]; meta?: { pagination?: Pagination | null } } | undefined,
): CursorPage<T> {
  const envelope = requireData(body ? { data: body } : undefined);
  return { items: envelope.data, nextCursor: nextCursor(envelope.meta?.pagination) };
}

export function flattenPages<T>(data: { pages: CursorPage<T>[] } | undefined): T[] {
  return data?.pages.flatMap((page) => page.items) ?? [];
}

export function useAccount() {
  return useQuery({
    queryKey: ["me"],
    staleTime: ACCOUNT_STALE_MS,
    queryFn: fetchAccount,
  });
}

async function fetchAccount(): Promise<Schemas["MeRead"]> {
  const { data } = await api.GET("/api/v1/me");
  return requireData(data);
}

export function useSchoolLeads(status: LeadStatus | null) {
  return useInfiniteQuery({
    queryKey: adminKeys.leads(status),
    initialPageParam: null as string | null,
    staleTime: LIST_STALE_MS,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.GET("/api/v1/admin/school-leads", {
        params: {
          query: {
            limit: PAGE_LIMIT,
            ...(pageParam ? { cursor: pageParam } : {}),
            ...(status ? { status } : {}),
          },
        },
      });
      return cursorPage(data);
    },
    getNextPageParam: (page) => page.nextCursor,
  });
}

export function useSchoolLead(leadId: string, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.lead(leadId),
    enabled,
    staleTime: LIST_STALE_MS,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/admin/school-leads/{lead_id}", {
        params: { path: { lead_id: leadId } },
      });
      return requireData(data);
    },
  });
}

export type LeadChange = Partial<LeadUpdateValues> & { organisation_id?: string };

export function leadUpdateBody(lead: SchoolLead, change: LeadChange): Schemas["SchoolLeadUpdate"] {
  const assigned = change.assigned_to ?? lead.assigned_to ?? "";
  return {
    status: change.status ?? lead.status,
    assigned_to: assigned === "" ? null : assigned,
    organisation_id: change.organisation_id ?? lead.organisation_id ?? null,
  };
}

export function useUpdateSchoolLead(lead: SchoolLead) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: LeadChange) => {
      const { data } = await api.PATCH("/api/v1/admin/school-leads/{lead_id}", {
        params: { path: { lead_id: lead.id } },
        body: leadUpdateBody(lead, change),
      });
      return requireData(data);
    },
    onSuccess: (saved: SchoolLead) => {
      queryClient.setQueryData(adminKeys.lead(lead.id), saved);
      void queryClient.invalidateQueries({ queryKey: ["admin", "school-leads"] });
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: adminKeys.settings,
    staleTime: SETTINGS_STALE_MS,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/admin/settings");
      return requireData(data);
    },
  });
}

export function useUpdateSetting(key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: number) => {
      const { data } = await api.PUT("/api/v1/admin/settings/{key}", {
        params: { path: { key } },
        body: { value },
      });
      return requireData(data);
    },
    onSuccess: (setting: Setting) => {
      queryClient.setQueryData<Setting[]>(adminKeys.settings, (current) =>
        current?.map((item) => (item.key === setting.key ? setting : item)),
      );
      void queryClient.invalidateQueries({ queryKey: adminKeys.settingHistory(setting.key) });
    },
  });
}

export function useSettingHistory(key: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: adminKeys.settingHistory(key),
    enabled,
    initialPageParam: null as string | null,
    staleTime: LIST_STALE_MS,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.GET("/api/v1/admin/settings/{key}/history", {
        params: {
          path: { key },
          query: { limit: PAGE_LIMIT, ...(pageParam ? { cursor: pageParam } : {}) },
        },
      });
      return cursorPage<SettingChange>(data);
    },
    getNextPageParam: (page) => page.nextCursor,
  });
}

export function useWebhooks() {
  return useInfiniteQuery({
    queryKey: adminKeys.webhooks,
    initialPageParam: null as string | null,
    staleTime: LIST_STALE_MS,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.GET("/api/v1/notifications/admin/webhooks", {
        params: { query: { limit: PAGE_LIMIT, ...(pageParam ? { cursor: pageParam } : {}) } },
      });
      return cursorPage<Webhook>(data);
    },
    getNextPageParam: (page) => page.nextCursor,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: WebhookCreateValues) => {
      const { data } = await api.POST("/api/v1/notifications/admin/webhooks", {
        body: {
          name: values.name.trim(),
          url: values.url.trim(),
          format: values.format.trim(),
          events: eventNames(values.events),
        },
      });
      return requireData<WebhookCreated>(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.webhooks });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { endpointId: string; active: boolean }) => {
      const { data } = await api.PATCH("/api/v1/notifications/admin/webhooks/{endpoint_id}", {
        params: { path: { endpoint_id: input.endpointId } },
        body: { active: input.active },
      });
      return requireData(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.webhooks });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (endpointId: string) => {
      await api.DELETE("/api/v1/notifications/admin/webhooks/{endpoint_id}", {
        params: { path: { endpoint_id: endpointId } },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.webhooks });
    },
  });
}

export function useDeliveries(status: DeliveryStatus | null, channel: Channel | null) {
  return useInfiniteQuery({
    queryKey: adminKeys.deliveries(status, channel),
    initialPageParam: null as string | null,
    staleTime: LIST_STALE_MS,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.GET("/api/v1/notifications/admin/deliveries", {
        params: {
          query: {
            limit: PAGE_LIMIT,
            ...(pageParam ? { cursor: pageParam } : {}),
            ...(status ? { status } : {}),
            ...(channel ? { channel } : {}),
          },
        },
      });
      return cursorPage<Delivery>(data);
    },
    getNextPageParam: (page) => page.nextCursor,
  });
}

export function usePublishSitePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: SitePageValues) => {
      const { data } = await api.POST("/api/v1/admin/site-pages", {
        body: {
          slug: values.slug,
          locale: values.locale,
          version: values.version.trim(),
          title: values.title.trim(),
          body: values.body.trim(),
        },
      });
      return requireData<SitePage>(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "site-pages"] });
    },
  });
}
