"use client";

import { ApiError, normaliseIdentifier } from "@keoshaa/core";
import type { components } from "@keoshaa/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api";

import { organisationIdSchema, schoolDetailsBody, type SchoolDetailsValues } from "./schemas";

type Organisation = components["schemas"]["OrganisationRead"];
type MySchool = components["schemas"]["MySchoolRead"];
type Me = components["schemas"]["MeRead"];

const LIST_STALE_MS = 15_000;
const ulid = organisationIdSchema;

const organisationSchema = z.object({
  id: ulid,
  name: z.string().min(1),
  kind: z.string().min(1),
  status: z.string().min(1),
  contact_phone: z.string().nullable().optional(),
  pan_number: z.string().nullable().optional(),
  vat_registered: z.boolean().optional().default(false),
  created_at: z.string().min(1),
  address: z
    .object({
      province: z.string().nullable().optional(),
      district: z.string().nullable().optional(),
      municipality: z.string().nullable().optional(),
      ward: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const mySchoolSchema = z.object({
  organisation_id: ulid,
  name: z.string().min(1),
  kind: z.string().min(1),
  status: z.string().min(1),
  role: z.string().min(1),
  title: z.string().nullable().optional(),
  joined_at: z.string().min(1),
});

const memberSchema = z.object({
  user_id: ulid,
  name: z.string(),
  roles: z.array(z.string()),
  title: z.string().nullable().optional(),
  joined_at: z.string(),
});

export type Member = z.infer<typeof memberSchema>;
export type { MySchool };

function requireData<T>(body: { data?: T } | undefined): T {
  if (!body?.data) throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
  return body.data;
}

function nextCursor(
  pagination:
    | components["schemas"]["CursorPagination"]
    | components["schemas"]["OffsetPagination"]
    | null
    | undefined,
): string | null {
  if (!pagination || !("next_cursor" in pagination)) return null;
  return pagination.next_cursor ?? null;
}

function cursorPage<T>(body: { data?: T[]; meta?: { pagination?: unknown } } | undefined) {
  const items = requireData(body);
  const pagination = body?.meta?.pagination as
    components["schemas"]["CursorPagination"] | undefined;
  return { items, nextCursor: nextCursor(pagination) };
}

function parseOrganisation(value: unknown): Organisation {
  const parsed = organisationSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
  return parsed.data;
}

function parseMember(value: unknown): Member {
  const parsed = memberSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
  return parsed.data;
}

export const schoolKeys = {
  mine: ["me", "schools"] as const,
  me: ["me"] as const,
  one: (organisationId: string) => ["school", "organisation", organisationId] as const,
  members: (organisationId: string, cursor: string | null) =>
    ["school", "organisation", organisationId, "members", cursor] as const,
};

export function useMe() {
  return useQuery({
    queryKey: schoolKeys.me,
    staleTime: 60_000,
    queryFn: async (): Promise<Me> => {
      const { data } = await api.GET("/api/v1/me");
      return requireData(data);
    },
  });
}

export function useMySchools() {
  return useQuery({
    queryKey: schoolKeys.mine,
    staleTime: LIST_STALE_MS,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/me/schools");
      return requireData(data).map((school) => {
        const parsed = mySchoolSchema.safeParse(school);
        if (!parsed.success) throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
        return parsed.data as MySchool;
      });
    },
  });
}

export function useOrganisation(organisationId: string, enabled: boolean) {
  return useQuery({
    queryKey: schoolKeys.one(organisationId),
    enabled,
    staleTime: LIST_STALE_MS,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/organisations/{organisation_id}", {
        params: { path: { organisation_id: organisationId } },
      });
      return parseOrganisation(requireData(data));
    },
  });
}

export function useUpdateOrganisation(organisationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: SchoolDetailsValues) => {
      const { data } = await api.PATCH("/api/v1/organisations/{organisation_id}", {
        params: { path: { organisation_id: organisationId } },
        body: schoolDetailsBody(values),
      });
      return parseOrganisation(requireData(data));
    },
    onSuccess: (organisation) => {
      queryClient.setQueryData(schoolKeys.one(organisationId), organisation);
      void queryClient.invalidateQueries({ queryKey: schoolKeys.mine });
    },
  });
}

export function useMembersPage(organisationId: string, cursor: string | null, enabled: boolean) {
  return useQuery({
    queryKey: schoolKeys.members(organisationId, cursor),
    enabled,
    staleTime: LIST_STALE_MS,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/organisations/{organisation_id}/members", {
        params: {
          path: { organisation_id: organisationId },
          query: { limit: 20, ...(cursor ? { cursor } : {}) },
        },
      });
      const page = cursorPage(data);
      return { items: page.items.map(parseMember), nextCursor: page.nextCursor };
    },
  });
}

export function useAddMember(organisationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { user_id: string; title: string }) => {
      const { data } = await api.POST("/api/v1/organisations/{organisation_id}/members", {
        params: { path: { organisation_id: organisationId } },
        body: {
          user_id: input.user_id,
          role: "school_staff",
          title: input.title === "" ? null : input.title,
        },
      });
      return requireData(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["school", "organisation", organisationId, "members"],
      });
    },
  });
}

export function useRemoveMember(organisationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.DELETE("/api/v1/organisations/{organisation_id}/members/{user_id}", {
        params: { path: { organisation_id: organisationId, user_id: userId } },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["school", "organisation", organisationId, "members"],
      });
    },
  });
}

export type AccountLookup = { id: string } | { error: "invalid" | "missing" };

export async function lookupAccount(account: string): Promise<AccountLookup> {
  const trimmed = account.trim();
  if (ulid.safeParse(trimmed).success) return { id: trimmed };
  const identifier = normaliseIdentifier(trimmed);
  if (!identifier) return { error: "invalid" };
  const { data } = await api.GET("/api/v1/users", {
    params: {
      query: { identifier: identifier.value, identifier_kind: identifier.kind, limit: 2 },
    },
  });
  const matches = cursorPage(data).items;
  const match = matches.length === 1 ? matches[0] : undefined;
  return match ? { id: match.id } : { error: "missing" };
}

export function canDoLabel(roles: string[]): "everything" | "readOnly" | "mixed" {
  if (roles.includes("school_admin")) return "everything";
  if (roles.length > 0 && roles.every((role) => role === "school_staff")) return "readOnly";
  return "mixed";
}
