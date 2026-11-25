"use client";

import { useState } from "react";

import { StateView } from "@/components/ui/StateView";
import { useMessages } from "@/lib/locale";

import { AdminPage } from "./AdminPage";
import { StatusPill, type PillTone } from "./DataTable";
import { QueryGate } from "./QueryGate";
import { RoleEditor } from "./RoleEditor";
import { usePermissions, useRoles } from "./rbac-api";

export function RoleScreen({ roleId }: { roleId: string }) {
  const { translate } = useMessages();
  const roles = useRoles();
  const permissions = usePermissions();
  const [removed, setRemoved] = useState(false);
  const role = roles.data?.find((item) => item.id === roleId);
  const tone: PillTone = role?.scope_kind === "organisation" ? "reward" : "primary";

  return (
    <AdminPage
      title={role?.name ?? translate("admin.role")}
      back={{ href: "/admin/roles", label: translate("admin.roles") }}
      badge={
        role ? (
          <>
            <StatusPill tone={tone}>
              {translate(
                role.scope_kind === "platform" ? "admin.scopePlatform" : "admin.scopeOrganisation",
              )}
            </StatusPill>
            <StatusPill tone={role.account_kind === "staff" ? "primary" : "quiet"}>
              {translate(`admin.userKind.${role.account_kind}`)}
            </StatusPill>
          </>
        ) : null
      }
      gap="gap-5"
    >
      {removed ? (
        <p role="status" className="text-caption text-admin-soft">
          {translate("admin.roleDeleted")}
        </p>
      ) : (
        <QueryGate
          query={roles}
          isEmpty={false}
          emptyTitle="admin.emptyPlatformRoles"
          emptyMessage="admin.emptyPlatformRolesBody"
        >
          <QueryGate
            query={permissions}
            isEmpty={false}
            emptyTitle="admin.noPermissions"
            emptyMessage="admin.noPermissions"
          >
            {role ? (
              <RoleEditor
                key={`${role.id}:${role.description}:${role.permissions.join("|")}`}
                role={role}
                catalog={permissions.data ?? []}
                onDeleted={() => setRemoved(true)}
              />
            ) : (
              <StateView
                title={translate("admin.notFoundTitle")}
                message={translate("admin.notFoundBody")}
              />
            )}
          </QueryGate>
        </QueryGate>
      )}
    </AdminPage>
  );
}
