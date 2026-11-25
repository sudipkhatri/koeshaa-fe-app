"use client";

import type { components } from "@keoshaa/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { fieldText, recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { useAdminUser } from "./account-detail-api";
import { AdminButton, AdminTextInput } from "./admin-ui";
import { formatDay } from "./format";
import { useOrganisation } from "./organisations-api";
import { useAssignRole, useRevokeRole, useRoles } from "./rbac-api";
import { assignRoleSchema, type AssignRoleValues } from "./rbac-schemas";
import { QueryGate } from "./QueryGate";

type Assignment = components["schemas"]["AssignmentRead"];
type Role = components["schemas"]["RoleRead"];

function roleMatch(roles: Role[] | undefined, value: string): Role | undefined {
  return roles?.find((role) => role.id === value || role.name === value);
}

function ScopeLabel({ id }: { id: string | null }) {
  const { translate } = useMessages();
  const org = useOrganisation(id ?? "", Boolean(id));
  if (!id) return translate("admin.scopePlatform");
  return org.data?.name ?? id;
}

function GivenBy({ id, at }: { id: string | null; at: string }) {
  if (!id) return <GrantedDate at={at} />;
  return <GrantedPerson id={id} at={at} />;
}

function GrantedDate({ at }: { at: string }) {
  const { locale } = useMessages();
  return formatDay(at, locale);
}

function GrantedPerson({ id, at }: { id: string; at: string }) {
  const { locale, translate } = useMessages();
  const person = useAdminUser(id);
  return translate("admin.givenByLine", {
    name: person.data?.name ?? "—",
    date: formatDay(at, locale),
  });
}

export function AccessRoles({
  userId,
  assignments,
}: {
  userId: string;
  assignments: Assignment[];
}) {
  const { locale, translate } = useMessages();
  const roles = useRoles();
  const revoke = useRevokeRole(userId);
  const list = roles.data;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-5">
      <h2 className="text-body font-semibold">{translate("admin.roles")}</h2>
      {assignments.length === 0 ? (
        <p className="text-caption text-admin-soft">{translate("admin.emptyRolesHeldBody")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignments.map((item) => {
            const match = roleMatch(list, item.role);
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  {match ? (
                    <Link
                      href={`/admin/roles/${match.id}`}
                      className="font-semibold text-primary hover:text-primary-pressed"
                    >
                      {match.name}
                    </Link>
                  ) : (
                    <p className="font-semibold">{item.role}</p>
                  )}
                  <p className="text-micro text-admin-soft">
                    <ScopeLabel id={item.scope_id} />
                    <span aria-hidden> · </span>
                    <GivenBy id={item.granted_by} at={item.created_at} />
                  </p>
                </div>
                <AdminButton
                  tone="quiet"
                  size="sm"
                  pending={revoke.isPending && revoke.variables === item.id}
                  onClick={() => void revoke.mutateAsync(item.id)}
                >
                  {translate("admin.takeAway")}
                </AdminButton>
              </li>
            );
          })}
        </ul>
      )}
      {revoke.isError ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errorMessage(revoke.error, translate, (seconds) => formatRetryTime(seconds, locale))}
        </p>
      ) : null}
      <p className="text-micro text-admin-soft">{translate("admin.sameRoleNote")}</p>
      <h3 className="text-body font-semibold">{translate("admin.giveRole")}</h3>
      <QueryGate
        query={roles}
        isEmpty={(list?.length ?? 0) === 0}
        emptyTitle="admin.emptyPlatformRoles"
        emptyMessage="admin.emptyPlatformRolesBody"
        inset
      >
        {list && list.length > 0 ? <GiveRoleForm userId={userId} roles={list} /> : null}
      </QueryGate>
    </section>
  );
}

function GiveRoleForm({ userId, roles }: { userId: string; roles: Role[] }) {
  const { locale, translate } = useMessages();
  const assign = useAssignRole(userId);
  const form = useForm<AssignRoleValues>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: { roleId: roles[0]?.id ?? "", scopeId: "" },
  });
  const roleId = useWatch({ control: form.control, name: "roleId" });
  const chosen = roles.find((role) => role.id === roleId);
  const organisation = chosen?.scope_kind === "organisation";
  const errors = form.formState.errors;

  return (
    <form
      noValidate
      aria-label={translate("admin.giveRole")}
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        if (organisation && !values.scopeId.trim()) {
          form.setError("scopeId", { message: "admin.scopeRequired" });
          return;
        }
        try {
          await assign.mutateAsync({ ...values, organisation });
          form.reset({ roleId: values.roleId, scopeId: "" });
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <ChoiceField
        label={translate("admin.role")}
        value={roleId}
        onChange={(event) => form.setValue("roleId", event.target.value)}
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </ChoiceField>
      {organisation ? (
        <AdminTextInput
          label={translate("admin.scopeId")}
          hint={translate("admin.scopeIdHint")}
          error={fieldText(errors.scopeId?.message, translate)}
          {...form.register("scopeId")}
        />
      ) : null}
      {errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errors.root.message}
        </p>
      ) : null}
      <AdminButton type="submit" className="self-start" pending={form.formState.isSubmitting}>
        {translate(errors.root?.type === "offline" ? "common.noConnection" : "admin.giveRole")}
      </AdminButton>
    </form>
  );
}
