"use client";

import type { components } from "@keoshaa/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput, ApiNote } from "./admin-ui";
import { useGrantPermission, usePermissions, useRevokePermission } from "./rbac-api";
import { grantSchema, type GrantValues } from "./rbac-schemas";
import { QueryGate } from "./QueryGate";

type Grant = components["schemas"]["DirectGrantRead"];

export function AccessGrants({ userId, grants }: { userId: string; grants: Grant[] }) {
  const { locale, translate } = useMessages();
  const permissions = usePermissions();
  const revoke = useRevokePermission(userId);
  const catalog = permissions.data;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-5">
      <div>
        <h2 className="text-body font-semibold">{translate("admin.extraPermissions")}</h2>
        <p className="text-caption text-admin-soft">{translate("admin.extraPermissionsHint")}</p>
      </div>
      {grants.length === 0 ? (
        <p className="text-caption text-admin-soft">{translate("admin.emptyGrantsBody")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {grants.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-caption">{item.permission}</p>
              <AdminButton
                tone="quiet"
                size="sm"
                pending={revoke.isPending && revoke.variables === item.id}
                onClick={() => void revoke.mutateAsync(item.id)}
              >
                {translate("admin.revoke")}
              </AdminButton>
            </li>
          ))}
        </ul>
      )}
      {revoke.isError ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errorMessage(revoke.error, translate, (seconds) => formatRetryTime(seconds, locale))}
        </p>
      ) : null}
      <QueryGate
        query={permissions}
        isEmpty={(catalog?.length ?? 0) === 0}
        emptyTitle="admin.noPermissions"
        emptyMessage="admin.noPermissions"
        inset
      >
        {catalog && catalog.length > 0 ? (
          <GrantForm userId={userId} names={catalog.map((item) => item.name)} />
        ) : null}
      </QueryGate>
      <ApiNote what={translate("admin.grantLimits")} />
    </section>
  );
}

function GrantForm({ userId, names }: { userId: string; names: string[] }) {
  const { locale, translate } = useMessages();
  const grant = useGrantPermission(userId);
  const form = useForm<GrantValues>({
    resolver: zodResolver(grantSchema),
    defaultValues: { permission: names[0] ?? "", scopeId: "" },
  });
  const permission = useWatch({ control: form.control, name: "permission" });
  const errors = form.formState.errors;

  return (
    <form
      noValidate
      aria-label={translate("admin.grantOne")}
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await grant.mutateAsync(values);
          form.reset({ permission: values.permission, scopeId: "" });
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <ChoiceField
        label={translate("admin.permissions")}
        value={permission}
        onChange={(event) => form.setValue("permission", event.target.value)}
      >
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </ChoiceField>
      <AdminTextInput
        label={translate("admin.scopeIdOptional")}
        hint={translate("admin.scopeIdOptionalHint")}
        {...form.register("scopeId")}
      />
      {errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errors.root.message}
        </p>
      ) : null}
      <AdminButton type="submit" className="self-start" pending={form.formState.isSubmitting}>
        {translate(errors.root?.type === "offline" ? "common.noConnection" : "admin.grantOne")}
      </AdminButton>
    </form>
  );
}
