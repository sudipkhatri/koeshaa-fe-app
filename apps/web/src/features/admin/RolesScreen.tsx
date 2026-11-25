"use client";

import { useState } from "react";

import { useMessages } from "@/lib/locale";

import { AdminButton, ApiNote } from "./admin-ui";
import { AdminPage } from "./AdminPage";
import { QueryGate } from "./QueryGate";
import { RoleCreateForm } from "./RoleCreateForm";
import { RoleTable } from "./RoleTable";
import { useRoles } from "./rbac-api";

export function RolesScreen() {
  const { translate } = useMessages();
  const roles = useRoles();
  const [creating, setCreating] = useState(false);
  const list = roles.data ?? [];

  return (
    <AdminPage
      title={translate("admin.roles")}
      subtitle={translate("admin.rolesSubtitle")}
      actions={
        <AdminButton onClick={() => setCreating((open) => !open)}>
          {translate("admin.newRole")}
        </AdminButton>
      }
      gap="gap-5"
    >
      <p className="rounded-xl bg-primary-tint px-4 py-3.5 text-caption text-admin-on-tint">
        {translate("admin.roleScopeNote")}
      </p>
      {creating ? <RoleCreateForm onCreated={() => setCreating(false)} /> : null}
      <QueryGate
        query={roles}
        isEmpty={false}
        emptyTitle="admin.emptyPlatformRoles"
        emptyMessage="admin.emptyPlatformRolesBody"
      >
        <RoleTable
          title={translate("admin.platformRoles")}
          hint={translate("admin.platformRolesHint")}
          roles={list.filter((role) => role.scope_kind === "platform")}
          empty={translate("admin.emptyPlatformRolesBody")}
        />
        <RoleTable
          title={translate("admin.organisationRoles")}
          hint={translate("admin.organisationRolesHint")}
          roles={list.filter((role) => role.scope_kind === "organisation")}
          empty={translate("admin.emptyOrganisationRolesBody")}
        />
        <p className="text-caption text-admin-soft">{translate("admin.rolesListNote")}</p>
        <ApiNote what={translate("admin.rolesPeopleMissing")} />
      </QueryGate>
    </AdminPage>
  );
}
