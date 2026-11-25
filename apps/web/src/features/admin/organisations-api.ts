"use client";

import { ApiError, normaliseIdentifier } from "@keoshaa/core";
import type { components } from "@keoshaa/api-client";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api";

import { cursorPage, LIST_STALE_MS, PAGE_LIMIT, requireData } from "./api";
import {
  organisationBody,
  organisationIdSchema,
  type MemberAddValues,
  type OrganisationFormValues,
  type OrganisationStatusValues,
} from "./organisation-schemas";

type OrganisationKind = components["schemas"]["OrganisationKind"];
type Organisation = components["schemas"]["OrganisationRead"];
type MySchool = components["schemas"]["MySchoolRead"];

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

function parseOrganisation(value: unknown): Organisation {
  const parsed = organisationSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
  return parsed.data;
}

export const organisationKeys = {
  list: (kind: OrganisationKind | null, query: string) =>
    ["admin", "organisations", kind, query] as const,
  one: (organisationId: string) => ["admin", "organisation", organisationId] as const,
  members: (organisationId: string) =>
    ["admin", "organisation", organisationId, "members"] as const,
  mine: ["me", "schools"] as const,
};

export function useOrganisations(kind: OrganisationKind | null, query: string) {
  return useInfiniteQuery({
    queryKey: organisationKeys.list(kind, query),
    initialPageParam: null as string | null,
    staleTime: LIST_STALE_MS,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.GET("/api/v1/organisations", {
        params: {
          query: {
            limit: PAGE_LIMIT,
            ...(pageParam ? { cursor: pageParam } : {}),
            ...(kind ? { kind } : {}),
            ...(query ? { q: query } : {}),
          },
        },
      });
      const page = cursorPage(data);
      return { items: page.items.map(parseOrganisation), nextCursor: page.nextCursor };
    },
    getNextPageParam: (page) => page.nextCursor,
  });
}

/** One page of organisations, for the paged table. */
export function useOrganisationsPage(
  kind: OrganisationKind | null,
  query: string,
  limit: number,
  cursor: string | null,
) {
  return useQuery({
    queryKey: [...organisationKeys.list(kind, query), "page", limit, cursor],
    staleTime: LIST_STALE_MS,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/organisations", {
        params: {
          query: {
            limit,
            ...(cursor ? { cursor } : {}),
            ...(kind ? { kind } : {}),
            ...(query ? { q: query } : {}),
          },
        },
      });
      const page = cursorPage(data);
      return { items: page.items.map(parseOrganisation), nextCursor: page.nextCursor };
    },
  });
}

export function useOrganisation(organisationId: string, enabled: boolean) {
  return useQuery({
    queryKey: organisationKeys.one(organisationId),
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

export function useCreateOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: OrganisationFormValues) => {
      const { data } = await api.POST("/api/v1/organisations", { body: organisationBody(values) });
      return parseOrganisation(requireData(data));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "organisations"] });
    },
  });
}

export function useUpdateOrganisation(organisationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: OrganisationFormValues) => {
      const body = organisationBody(values);
      const { data } = await api.PATCH("/api/v1/organisations/{organisation_id}", {
        params: { path: { organisation_id: organisationId } },
        body: {
          name: body.name,
          address: body.address,
          contact_phone: body.contact_phone,
          pan_number: body.pan_number,
          vat_registered: body.vat_registered,
        },
      });
      return parseOrganisation(requireData(data));
    },
    onSuccess: (organisation) => {
      queryClient.setQueryData(organisationKeys.one(organisationId), organisation);
      void queryClient.invalidateQueries({ queryKey: ["admin", "organisations"] });
    },
  });
}

export function useOrganisationStatus(organisationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: OrganisationStatusValues) => {
      const { data } = await api.POST("/api/v1/organisations/{organisation_id}/status", {
        params: { path: { organisation_id: organisationId } },
        body: { status: values.status },
      });
      return parseOrganisation(requireData(data));
    },
    onSuccess: (organisation) => {
      queryClient.setQueryData(organisationKeys.one(organisationId), organisation);
      void queryClient.invalidateQueries({ queryKey: ["admin", "organisations"] });
    },
  });
}

export function useAddMember(organisationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: MemberAddValues) => {
      const { data } = await api.POST("/api/v1/organisations/{organisation_id}/members", {
        params: { path: { organisation_id: organisationId } },
        body: {
          user_id: values.user_id,
          role: values.role,
          title: values.title === "" ? null : values.title,
        },
      });
      const member = requireData(data);
      if (!ulid.safeParse(member.user_id).success) {
        throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
      }
      return member;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organisationKeys.members(organisationId) });
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
      void queryClient.invalidateQueries({ queryKey: organisationKeys.members(organisationId) });
    },
  });
}

const memberSchema = z.object({
  user_id: ulid,
  name: z.string(),
  roles: z.array(z.string()),
  title: z.string().nullable().optional(),
  joined_at: z.string(),
});

export type Member = z.infer<typeof memberSchema>;

function parseMember(value: unknown): Member {
  const parsed = memberSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
  return parsed.data;
}

export function useMembers(organisationId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: organisationKeys.members(organisationId),
    enabled,
    initialPageParam: null as string | null,
    staleTime: LIST_STALE_MS,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.GET("/api/v1/organisations/{organisation_id}/members", {
        params: {
          path: { organisation_id: organisationId },
          query: { limit: 100, ...(pageParam ? { cursor: pageParam } : {}) },
        },
      });
      const page = cursorPage(data);
      return { items: page.items.map(parseMember), nextCursor: page.nextCursor };
    },
    getNextPageParam: (page) => page.nextCursor,
  });
}

export type AccountLookup = { id: string } | { error: "invalid" | "missing" };

/** An account id, or the one account that signs in with this phone, email or username. */
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

export function useMySchools() {
  return useQuery({
    queryKey: organisationKeys.mine,
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
