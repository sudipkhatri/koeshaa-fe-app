"use client";

import type { components } from "@keoshaa/api-client";
import Link from "next/link";

import { useMessages } from "@/lib/locale";

import { ApiTag } from "./admin-ui";
import { BodyRow, ColumnCell, ColumnHead, DataTable, StatusPill } from "./DataTable";

type Role = components["schemas"]["RoleRead"];

export function RoleTable({
  title,
  hint,
  roles,
  empty,
}: {
  title: string;
  hint: string;
  roles: Role[];
  empty: string;
}) {
  const { translate } = useMessages();
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-body font-semibold">{title}</h2>
        <p className="text-caption text-admin-soft">{hint}</p>
      </div>
      {roles.length === 0 ? (
        <p className="text-caption text-admin-soft">{empty}</p>
      ) : (
        <DataTable minWidth="min-w-190">
          <thead>
            <tr>
              <ColumnHead>{translate("admin.role")}</ColumnHead>
              <ColumnHead>{translate("admin.givenTo")}</ColumnHead>
              <ColumnHead align="right">{translate("admin.permissions")}</ColumnHead>
              <ColumnHead>
                <span className="inline-flex items-center gap-1.5">
                  {translate("admin.people")}
                  <ApiTag />
                </span>
              </ColumnHead>
              <ColumnHead>{translate("admin.actions")}</ColumnHead>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <BodyRow key={role.id}>
                <ColumnCell>
                  <Link
                    href={`/admin/roles/${role.id}`}
                    className="font-semibold text-primary hover:text-primary-pressed"
                  >
                    {role.name}
                  </Link>
                  {role.is_system ? (
                    <StatusPill tone="sky">{translate("admin.builtIn")}</StatusPill>
                  ) : null}
                  {role.description ? (
                    <p className="text-caption text-admin-soft">{role.description}</p>
                  ) : null}
                </ColumnCell>
                <ColumnCell>{translate(`admin.userKind.${role.account_kind}`)}</ColumnCell>
                <ColumnCell align="right">{role.permissions.length}</ColumnCell>
                <ColumnCell>—</ColumnCell>
                <ColumnCell>
                  <Link
                    href={`/admin/roles/${role.id}`}
                    className="text-caption font-semibold text-primary hover:text-primary-pressed"
                  >
                    {translate(role.is_system ? "admin.viewRole" : "admin.editRole")}
                  </Link>
                </ColumnCell>
              </BodyRow>
            ))}
          </tbody>
        </DataTable>
      )}
    </section>
  );
}
