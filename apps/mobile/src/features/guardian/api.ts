import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { normaliseIdentifier } from "@keoshaa/core";

import type { Relationship } from "@/features/parent/schemas";
import { useApi } from "@/features/session/use-api";
import { keys } from "@/lib/query";

export interface Guardianship {
  id: string;
  parentId: string | null;
  studentId: string;
  relationship: Relationship;
  state: "pending" | "active" | "removed";
  invitedPhone: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
}

function mapLink(row: {
  id: string;
  parent_id: string | null;
  student_id: string;
  relationship: Relationship;
  state: "pending" | "active" | "removed";
  invited_phone: string | null;
  expires_at: string | null;
  accepted_at: string | null;
}): Guardianship {
  return {
    id: row.id,
    parentId: row.parent_id,
    studentId: row.student_id,
    relationship: row.relationship,
    state: row.state,
    invitedPhone: row.invited_phone,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
  };
}

/** Invitations sent to this parent's phone (OpenAPI: parents). */
export function useGuardianInvitations() {
  const api = useApi();
  return useQuery({
    queryKey: keys.invitations,
    staleTime: 30_000,
    queryFn: async (): Promise<Guardianship[]> => {
      if (!api) {
        return [
          {
            id: "inv-1",
            parentId: null,
            studentId: "stu-1",
            relationship: "mother",
            state: "pending",
            invitedPhone: "+9779800000044",
            expiresAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
            acceptedAt: null,
          },
        ];
      }
      const { data } = await api.GET("/api/v1/me/guardian-invitations");
      return (data?.data ?? []).map(mapLink);
    },
  });
}

/** Student invites a parent by SMS. */
export function useInviteParent() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { phone: string; relationship: Relationship }) => {
      if (!api) {
        return {
          id: `inv-${Date.now()}`,
          parentId: null,
          studentId: "me",
          relationship: input.relationship,
          state: "pending" as const,
          invitedPhone: input.phone,
          expiresAt: null,
          acceptedAt: null,
        };
      }
      const identifier = normaliseIdentifier(input.phone);
      const { data } = await api.POST("/api/v1/me/guardian-invitations", {
        body: {
          phone: identifier?.value ?? input.phone,
          relationship: input.relationship,
        },
      });
      return data?.data ? mapLink(data.data) : null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.invitations }),
  });
}

export function useAcceptInvitation() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      if (!api) return;
      await api.POST("/api/v1/me/guardian-invitations/{link_id}/accept", {
        params: { path: { link_id: linkId } },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.invitations });
      void queryClient.invalidateQueries({ queryKey: keys.children });
    },
  });
}

export function useResendInvitation() {
  const api = useApi();
  return useMutation({
    mutationFn: async (linkId: string) => {
      if (!api) return;
      await api.POST("/api/v1/me/guardian-invitations/{link_id}/resend", {
        params: { path: { link_id: linkId } },
      });
    },
  });
}

/** Cancel a pending invite or end an active link (either side). */
export function useEndGuardianship() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      if (!api) return;
      await api.DELETE("/api/v1/me/guardianships/{link_id}", {
        params: { path: { link_id: linkId } },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.invitations });
      void queryClient.invalidateQueries({ queryKey: keys.children });
    },
  });
}
