"use client";

import type { components } from "@keoshaa/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { LIST_STALE_MS, requireData } from "./api";
import type { AssignRoleValues, GrantValues, RoleCreateValues } from "./rbac-schemas";

type Role = components["schemas"]["RoleRead"];
type Permission = components["schemas"]["PermissionRead"];
type Access = components["schemas"]["UserAccessRead"];

const CATALOG_STALE_MS = 60_000;

export const rbacKeys = {
  roles: ["admin", "rbac", "roles"] as const,
  permissions: ["admin", "rbac", "permissions"] as const,
  access: (userId: string) => ["admin", "rbac", "access", userId] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: rbacKeys.roles,
    staleTime: CATALOG_STALE_MS,
    queryFn: async (): Promise<Role[]> => {
      const { data } = await api.GET("/api/v1/rbac/roles");
      return requireData(data);
    },
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: rbacKeys.permissions,
    staleTime: CATALOG_STALE_MS,
    queryFn: async (): Promise<Permission[]> => {
      const { data } = await api.GET("/api/v1/rbac/permissions");
      return requireData(data);
    },
  });
}

export function useUserAccess(userId: string) {
  return useQuery({
    queryKey: rbacKeys.access(userId),
    staleTime: LIST_STALE_MS,
    queryFn: async (): Promise<Access> => {
      const { data } = await api.GET("/api/v1/rbac/users/{user_id}", {
        params: { path: { user_id: userId } },
      });
      return requireData(data);
    },
  });
}

function useRefreshAccess(userId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: rbacKeys.access(userId) });
    void queryClient.invalidateQueries({ queryKey: ["admin", "access", userId] });
  };
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: RoleCreateValues) => {
      const { data } = await api.POST("/api/v1/rbac/roles", {
        body: {
          name: values.name.trim(),
          account_kind: values.accountKind,
          scope_kind: values.scopeKind,
          description: values.description.trim(),
          permissions: [],
        },
      });
      return requireData(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rbacKeys.roles });
    },
  });
}

export function useUpdateRole(roleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { description: string; permissions: string[] }) => {
      const { data } = await api.PATCH("/api/v1/rbac/roles/{role_id}", {
        params: { path: { role_id: roleId } },
        body,
      });
      return requireData(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rbacKeys.roles });
    },
  });
}

export function useDeleteRole(roleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.DELETE("/api/v1/rbac/roles/{role_id}", {
        params: { path: { role_id: roleId } },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rbacKeys.roles });
    },
  });
}

export function useAssignRole(userId: string) {
  const refresh = useRefreshAccess(userId);
  return useMutation({
    mutationFn: async (values: AssignRoleValues & { organisation: boolean }) => {
      const scopeId = values.scopeId.trim();
      const { data } = await api.POST("/api/v1/rbac/users/{user_id}/roles", {
        params: { path: { user_id: userId } },
        body: values.organisation
          ? { role_id: values.roleId, scope_id: scopeId }
          : { role_id: values.roleId },
      });
      return requireData(data);
    },
    onSuccess: refresh,
  });
}

export function useRevokeRole(userId: string) {
  const refresh = useRefreshAccess(userId);
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.DELETE("/api/v1/rbac/users/{user_id}/roles/{assignment_id}", {
        params: { path: { user_id: userId, assignment_id: assignmentId } },
      });
    },
    onSuccess: refresh,
  });
}

export function useGrantPermission(userId: string) {
  const refresh = useRefreshAccess(userId);
  return useMutation({
    mutationFn: async (values: GrantValues) => {
      const scopeId = values.scopeId.trim();
      const { data } = await api.POST("/api/v1/rbac/users/{user_id}/permissions", {
        params: { path: { user_id: userId } },
        body: scopeId
          ? { permission: values.permission, scope_id: scopeId }
          : { permission: values.permission },
      });
      return requireData(data);
    },
    onSuccess: refresh,
  });
}

export function useRevokePermission(userId: string) {
  const refresh = useRefreshAccess(userId);
  return useMutation({
    mutationFn: async (grantId: string) => {
      await api.DELETE("/api/v1/rbac/users/{user_id}/permissions/{grant_id}", {
        params: { path: { user_id: userId, grant_id: grantId } },
      });
    },
    onSuccess: refresh,
  });
}
