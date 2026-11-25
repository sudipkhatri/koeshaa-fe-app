"use client";

import type { components } from "@keoshaa/api-client";
import { useMemo, useState } from "react";

import { errorMessage, formatRetryTime } from "@/lib/errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput, ApiNote, FieldLabel } from "./admin-ui";
import { StatusPill } from "./DataTable";
import { useDeleteRole, useUpdateRole } from "./rbac-api";

type Role = components["schemas"]["RoleRead"];
type Permission = components["schemas"]["PermissionRead"];

function groups(catalog: Permission[], filter: string): [string, Permission[]][] {
  const query = filter.trim().toLocaleLowerCase();
  const grouped = new Map<string, Permission[]>();
  for (const item of catalog) {
    if (
      query &&
      !item.name.toLocaleLowerCase().includes(query) &&
      !item.description.toLocaleLowerCase().includes(query)
    ) {
      continue;
    }
    const key = item.name.split(".")[0] || item.name;
    const list = grouped.get(key) ?? [];
    list.push(item);
    grouped.set(key, list);
  }
  return [...grouped.entries()];
}

export function RoleEditor({
  role,
  catalog,
  onDeleted,
}: {
  role: Role;
  catalog: Permission[];
  onDeleted: () => void;
}) {
  const { locale, translate } = useMessages();
  const update = useUpdateRole(role.id);
  const remove = useDeleteRole(role.id);
  const [description, setDescription] = useState(role.description);
  const [selected, setSelected] = useState(() => new Set(role.permissions));
  const [filter, setFilter] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const visible = useMemo(() => groups(catalog, filter), [catalog, filter]);
  const readOnly = role.is_system;

  function toggle(name: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function save() {
    setFailure(null);
    try {
      await update.mutateAsync({ description, permissions: [...selected] });
    } catch (error) {
      setFailure(errorMessage(error, translate, (seconds) => formatRetryTime(seconds, locale)));
    }
  }

  async function deleteRole() {
    setFailure(null);
    try {
      await remove.mutateAsync();
      onDeleted();
    } catch (error) {
      setFailure(errorMessage(error, translate, (seconds) => formatRetryTime(seconds, locale)));
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="flex min-w-0 grow basis-110 flex-col gap-5">
        <section className="flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-surface p-5">
          <FieldLabel htmlFor="role-description">{translate("admin.description")}</FieldLabel>
          <textarea
            id="role-description"
            rows={3}
            value={description}
            disabled={readOnly}
            className="min-h-24 rounded-square border border-admin-border bg-admin-surface px-3 py-2 text-admin-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-admin-subtle"
            onChange={(event) => setDescription(event.target.value)}
          />
          <p className="text-micro text-admin-soft">{translate("admin.roleDescriptionHint")}</p>
        </section>
        <section className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-caption text-admin-soft">
              {translate("admin.selectedOf", { selected: selected.size, total: catalog.length })}
            </p>
            <AdminTextInput
              label={translate("admin.filterPermissions")}
              type="search"
              value={filter}
              className="w-full sm:w-65"
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          {visible.length === 0 ? (
            <p className="text-caption text-admin-soft">{translate("admin.noPermissions")}</p>
          ) : (
            visible.map(([group, items]) => (
              <fieldset key={group} className="flex flex-col gap-2.5">
                <legend className="text-caption font-semibold capitalize">{group}</legend>
                {items.map((item) => (
                  <label key={item.name} className="flex min-h-11 items-start gap-2.5">
                    <input
                      type="checkbox"
                      className="mt-1 size-4"
                      checked={selected.has(item.name)}
                      disabled={readOnly}
                      onChange={() => toggle(item.name)}
                    />
                    <span>
                      <span className="block text-caption">{item.name}</span>
                      <span className="block text-micro text-admin-soft">{item.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            ))
          )}
          <p className="text-micro text-admin-soft">{translate("admin.savePermissionsNote")}</p>
          {readOnly ? (
            <p className="text-caption text-admin-soft">{translate("admin.systemRoleNote")}</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              <AdminButton
                tone="quiet"
                onClick={() => {
                  setDescription(role.description);
                  setSelected(new Set(role.permissions));
                  setFailure(null);
                }}
              >
                {translate("admin.discard")}
              </AdminButton>
              <AdminButton pending={update.isPending} onClick={() => void save()}>
                {translate("admin.savePermissions")}
              </AdminButton>
            </div>
          )}
          {update.isSuccess ? (
            <p role="status" className="text-caption text-admin-soft">
              {translate("admin.permissionsSaved")}
            </p>
          ) : null}
          {failure ? (
            <p role="alert" className="text-caption text-admin-danger">
              {failure}
            </p>
          ) : null}
        </section>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-5 sm:w-75">
        <section className="flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-surface p-5">
          <h2 className="text-body font-semibold">{translate("admin.fixedAtCreation")}</h2>
          <p className="text-caption">
            <span className="text-admin-soft">{translate("admin.name")}</span> {role.name}
          </p>
          <p className="text-caption">
            <span className="text-admin-soft">{translate("admin.givenTo")}</span>{" "}
            {translate("admin.accountsOfKind", {
              kind: translate(`admin.userKind.${role.account_kind}`),
            })}
          </p>
          <p className="text-caption">
            <span className="text-admin-soft">{translate("admin.scope")}</span>{" "}
            <StatusPill tone={role.scope_kind === "platform" ? "primary" : "reward"}>
              {translate(
                role.scope_kind === "platform" ? "admin.scopePlatform" : "admin.scopeOrganisation",
              )}
            </StatusPill>
          </p>
          <p className="text-micro text-admin-soft">{translate("admin.fixedNote")}</p>
        </section>
        <section className="flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-surface p-5">
          <h2 className="text-body font-semibold">{translate("admin.whoHoldsIt")}</h2>
          <ApiNote what={translate("admin.holdersMissing")} />
        </section>
        <section className="flex flex-col gap-3 rounded-xl border border-admin-danger-line bg-admin-surface p-5">
          <h2 className="text-body font-semibold text-admin-danger">
            {translate("admin.deleteRole")}
          </h2>
          <p className="text-caption text-admin-soft">{translate("admin.deleteRoleNote")}</p>
          <AdminButton
            tone="dangerQuiet"
            className="w-full"
            disabled={readOnly}
            pending={remove.isPending}
            onClick={() => void deleteRole()}
          >
            {translate("admin.deleteRoleButton")}
          </AdminButton>
        </section>
      </div>
    </div>
  );
}
