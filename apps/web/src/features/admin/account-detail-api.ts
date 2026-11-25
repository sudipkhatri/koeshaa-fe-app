"use client";

import type { components } from "@keoshaa/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import type {
  AccountDetailsValues,
  ConsentValues,
  IdentifierAddValues,
  PauseValues,
} from "./account-schemas";
import { LIST_STALE_MS, requireData } from "./api";
import { endViewSessionLocally, getViewSession, startViewSession } from "./view-session";

type User = components["schemas"]["UserRead"];

const detailKey = (userId: string) => ["admin", "accounts", "detail", userId] as const;

export function useAdminUser(userId: string, enabled = true) {
  return useQuery({
    queryKey: detailKey(userId),
    enabled: enabled && userId.length > 0,
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<User> => {
      const { data } = await api.GET("/api/v1/users/{user_id}", {
        params: { path: { user_id: userId } },
      });
      return requireData(data);
    },
  });
}

export function useConsents(userId: string) {
  return useQuery({
    queryKey: ["admin", "accounts", "consents", userId] as const,
    staleTime: LIST_STALE_MS,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/users/{user_id}/consents", {
        params: { path: { user_id: userId } },
      });
      return requireData(data);
    },
  });
}

export function useGuardianships(userId: string) {
  return useQuery({
    queryKey: ["admin", "accounts", "guardians", userId] as const,
    staleTime: LIST_STALE_MS,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/users/{user_id}/guardianships", {
        params: { path: { user_id: userId } },
      });
      return requireData(data);
    },
  });
}

function useRefresh(userId: string, keys: readonly (readonly string[])[]) {
  const queryClient = useQueryClient();
  return () => {
    for (const key of keys) void queryClient.invalidateQueries({ queryKey: key });
  };
}

export function useUpdateUser(userId: string) {
  const refresh = useRefresh(userId, [detailKey(userId), ["admin", "accounts", "page"]]);
  return useMutation({
    mutationFn: async (values: AccountDetailsValues) => {
      const { data } = await api.PATCH("/api/v1/users/{user_id}", {
        params: { path: { user_id: userId } },
        body: {
          name: values.name.trim(),
          locale: values.locale,
          date_of_birth: values.dateOfBirth || null,
        },
      });
      return requireData(data);
    },
    onSuccess: refresh,
  });
}

export function useAddIdentifier(userId: string) {
  const refresh = useRefresh(userId, [detailKey(userId)]);
  return useMutation({
    mutationFn: async (values: IdentifierAddValues & { identifier: string }) => {
      const { data } = await api.POST("/api/v1/users/{user_id}/identifiers", {
        params: { path: { user_id: userId } },
        body: { kind: values.kind, value: values.identifier, verified: false },
      });
      return requireData(data);
    },
    onSuccess: refresh,
  });
}

export function useRemoveIdentifier(userId: string) {
  const refresh = useRefresh(userId, [detailKey(userId)]);
  return useMutation({
    mutationFn: async (identifierId: string) => {
      await api.DELETE("/api/v1/users/{user_id}/identifiers/{identifier_id}", {
        params: { path: { user_id: userId, identifier_id: identifierId } },
      });
    },
    onSuccess: refresh,
  });
}

export function usePauseUser(userId: string) {
  const refresh = useRefresh(userId, [detailKey(userId), ["admin", "accounts", "page"]]);
  return useMutation({
    mutationFn: async (values: PauseValues) => {
      const { data } = await api.POST("/api/v1/users/{user_id}/pause", {
        params: { path: { user_id: userId } },
        body: { reason: values.reason, note: values.note || null },
      });
      return requireData(data);
    },
    onSuccess: refresh,
  });
}

export function useResumeUser(userId: string) {
  const refresh = useRefresh(userId, [detailKey(userId), ["admin", "accounts", "page"]]);
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.POST("/api/v1/users/{user_id}/resume", {
        params: { path: { user_id: userId } },
      });
      return requireData(data);
    },
    onSuccess: refresh,
  });
}

export function useCloseUser(userId: string) {
  const refresh = useRefresh(userId, [detailKey(userId), ["admin", "accounts", "page"]]);
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.POST("/api/v1/users/{user_id}/close", {
        params: { path: { user_id: userId } },
      });
      return requireData(data);
    },
    onSuccess: refresh,
  });
}

export function useReopenUser(userId: string) {
  const refresh = useRefresh(userId, [detailKey(userId), ["admin", "accounts", "page"]]);
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.POST("/api/v1/users/{user_id}/reopen", {
        params: { path: { user_id: userId } },
      });
      return requireData(data);
    },
    onSuccess: refresh,
  });
}

export function useEndSessions(userId: string) {
  return useMutation({
    mutationFn: async () => {
      await api.POST("/api/v1/users/{user_id}/sessions/end", {
        params: { path: { user_id: userId } },
      });
    },
  });
}

/**
 * Starts a read-only view. Staff token stays in `@/lib/session`; the view token is
 * held in memory only via `view-session` (never storage, never rendered).
 */
export function useStartView(userId: string) {
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const { data } = await api.POST("/api/v1/users/{user_id}/impersonate", {
        params: { path: { user_id: userId } },
      });
      const session = requireData(data);
      startViewSession({
        accessToken: session.access_token,
        userId: session.user_id,
        name: input.name,
        expiresIn: session.expires_in,
        readOnly: session.read_only,
      });
      return {
        userId: session.user_id,
        expiresIn: session.expires_in,
        readOnly: session.read_only,
      };
    },
  });
}

/** Ends the active view session with the staff token, then clears memory view state. */
export function useEndView() {
  return useMutation({
    mutationFn: async () => {
      const session = getViewSession();
      if (!session) return null;
      await api.POST("/api/v1/users/{user_id}/impersonate/end", {
        params: { path: { user_id: session.userId } },
      });
      return endViewSessionLocally();
    },
  });
}

export function useRecordConsent(userId: string) {
  const refresh = useRefresh(userId, [["admin", "accounts", "consents", userId]]);
  return useMutation({
    mutationFn: async (values: ConsentValues) => {
      const { data } = await api.POST("/api/v1/users/{user_id}/consents", {
        params: { path: { user_id: userId } },
        body: {
          document: values.document,
          version: values.version.trim(),
          ...(values.givenBy ? { given_by: values.givenBy } : {}),
        },
      });
      return requireData(data);
    },
    onSuccess: refresh,
  });
}

export function useEndGuardianship(userId: string) {
  const refresh = useRefresh(userId, [["admin", "accounts", "guardians", userId]]);
  return useMutation({
    mutationFn: async (linkId: string) => {
      await api.DELETE("/api/v1/users/guardianships/{link_id}", {
        params: { path: { link_id: linkId } },
      });
    },
    onSuccess: refresh,
  });
}

export function useResetAuthenticator(userId: string) {
  return useMutation({
    mutationFn: async () => {
      await api.POST("/api/v1/users/{user_id}/mfa/reset", {
        params: { path: { user_id: userId } },
      });
    },
  });
}
