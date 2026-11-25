import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiClient } from "@keoshaa/api-client";
import { detectIdentifier, normaliseIdentifier } from "@keoshaa/core";

import { isoDate } from "@/features/auth/api";
import { currentConsentVersions } from "@/features/legal/api";
import { useApi } from "@/features/session/use-api";
import { keys } from "@/lib/query";

import type { AddChildValues, Relationship } from "./schemas";

export interface LinkedChild {
  id: string;
  name: string;
  relationship: Relationship;
  /** Grade label when the API sends one; class/stream are not on this list. */
  grade: string | null;
}

export interface ChildDevice {
  id: string;
  name: string;
  lastSeenAt: string;
  isThisDevice: boolean;
}

const MOCK_CHILDREN: LinkedChild[] = [
  { id: "child-asha", name: "Asha Shrestha", relationship: "mother", grade: "Class 11" },
  { id: "child-bikash", name: "Bikash Shrestha", relationship: "mother", grade: "Class 8" },
];

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const DAY = 86_400_000;

function mockDevices(): ChildDevice[] {
  return [
    { id: "cd1", name: "Redmi Note 12", lastSeenAt: ago(0), isThisDevice: false },
    { id: "cd2", name: "School tablet", lastSeenAt: ago(14 * DAY), isThisDevice: false },
  ];
}

function mapChild(row: {
  user_id: string;
  name: string;
  relationship: Relationship;
  grade?: string | null;
}): LinkedChild {
  return {
    id: row.user_id,
    name: row.name,
    relationship: row.relationship,
    grade: row.grade ?? null,
  };
}

async function loadChildren(api: ApiClient): Promise<LinkedChild[]> {
  const { data } = await api.GET("/api/v1/me/children");
  return (data?.data ?? []).map(mapChild);
}

export function useChildren() {
  const api = useApi();
  return useQuery({
    queryKey: keys.children,
    staleTime: 30_000,
    queryFn: () => (api ? loadChildren(api) : Promise.resolve(MOCK_CHILDREN)),
  });
}

export function useAddChild() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: AddChildValues) => {
      const identifier = normaliseIdentifier(values.identifier);
      if (!identifier) throw new Error("VALIDATION_ERROR");
      const kind = detectIdentifier(values.identifier);
      const child = {
        name: values.name.trim(),
        date_of_birth: isoDate(values.year, values.month, values.day),
        relationship: values.relationship,
        password: values.password,
        ...(kind === "phone" ? { phone: identifier.value } : { username: identifier.value }),
      };
      if (!api) {
        const next: LinkedChild = {
          id: `child-${Date.now()}`,
          name: child.name,
          relationship: values.relationship,
          grade: null,
        };
        queryClient.setQueryData<LinkedChild[]>(keys.children, (list) => [...(list ?? []), next]);
        return next;
      }
      const versions = await currentConsentVersions(api);
      const { data } = await api.POST("/api/v1/me/children", {
        body: {
          child,
          consents: {
            terms_version: versions.termsVersion,
            privacy_version: versions.privacyVersion,
          },
        },
      });
      const created = data?.data;
      return {
        id: created?.user_id ?? "",
        name: created?.name ?? child.name,
        relationship: values.relationship,
        grade: null,
      } satisfies LinkedChild;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.children }),
  });
}

export function useChildDevices(childId: string) {
  const api = useApi();
  return useQuery({
    queryKey: keys.childDevices(childId),
    enabled: Boolean(childId),
    staleTime: 30_000,
    queryFn: async (): Promise<ChildDevice[]> => {
      if (!api) return mockDevices();
      const { data } = await api.GET("/api/v1/me/children/{child_id}/devices", {
        params: { path: { child_id: childId } },
      });
      return (data?.data ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        lastSeenAt: d.last_seen_at,
        isThisDevice: d.current,
      }));
    },
  });
}

export function useRemoveChildDevice(childId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deviceId: string) => {
      if (api) {
        await api.DELETE("/api/v1/me/children/{child_id}/devices/{device_id}", {
          params: { path: { child_id: childId, device_id: deviceId } },
        });
      } else {
        queryClient.setQueryData<ChildDevice[]>(keys.childDevices(childId), (list) =>
          list?.filter((d) => d.id !== deviceId),
        );
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.childDevices(childId) }),
  });
}

export function useUpdateChild(childId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      if (api) {
        await api.PATCH("/api/v1/me/children/{child_id}", {
          params: { path: { child_id: childId } },
          body: { name: input.name.trim() },
        });
      } else {
        queryClient.setQueryData<LinkedChild[]>(keys.children, (list) =>
          list?.map((c) => (c.id === childId ? { ...c, name: input.name.trim() } : c)),
        );
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.children }),
  });
}

export function useChildPassword(childId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: async (input: { password: string; parentPassword: string }) => {
      if (!api) return;
      await api.POST("/api/v1/me/children/{child_id}/password", {
        params: { path: { child_id: childId } },
        body: { password: input.password, parent_password: input.parentPassword },
      });
    },
  });
}

export function useCloseChild(childId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      if (api) {
        await api.POST("/api/v1/me/children/{child_id}/close", {
          params: { path: { child_id: childId } },
          body: { password },
        });
      } else {
        queryClient.setQueryData<LinkedChild[]>(keys.children, (list) =>
          list?.filter((c) => c.id !== childId),
        );
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.children }),
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
