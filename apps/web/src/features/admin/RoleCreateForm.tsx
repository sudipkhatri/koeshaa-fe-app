"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { fieldText, recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput, FieldLabel } from "./admin-ui";
import { useCreateRole } from "./rbac-api";
import { roleCreateSchema, type RoleCreateValues } from "./rbac-schemas";

export function RoleCreateForm({ onCreated }: { onCreated: () => void }) {
  const { locale, translate } = useMessages();
  const create = useCreateRole();
  const form = useForm<RoleCreateValues>({
    resolver: zodResolver(roleCreateSchema),
    defaultValues: { name: "", accountKind: "member", scopeKind: "platform", description: "" },
  });
  const accountKind = useWatch({ control: form.control, name: "accountKind" });
  const scopeKind = useWatch({ control: form.control, name: "scopeKind" });
  const errors = form.formState.errors;

  return (
    <form
      noValidate
      aria-label={translate("admin.newRole")}
      className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-5"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await create.mutateAsync(values);
          form.reset();
          onCreated();
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <AdminTextInput
        label={translate("admin.name")}
        error={fieldText(errors.name?.message, translate)}
        {...form.register("name")}
      />
      <ChoiceField
        label={translate("admin.accountKind")}
        value={accountKind}
        onChange={(event) =>
          form.setValue("accountKind", event.target.value as RoleCreateValues["accountKind"])
        }
      >
        <option value="member">{translate("admin.userKind.member")}</option>
        <option value="staff">{translate("admin.userKind.staff")}</option>
      </ChoiceField>
      <ChoiceField
        label={translate("admin.scope")}
        value={scopeKind}
        onChange={(event) =>
          form.setValue("scopeKind", event.target.value as RoleCreateValues["scopeKind"])
        }
      >
        <option value="platform">{translate("admin.scopePlatform")}</option>
        <option value="organisation">{translate("admin.scopeOrganisation")}</option>
      </ChoiceField>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="role-description">{translate("admin.description")}</FieldLabel>
        <textarea
          id="role-description"
          rows={3}
          className="min-h-24 rounded-square border border-admin-border bg-admin-surface px-3 py-2 text-admin-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          {...form.register("description")}
        />
      </div>
      {errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errors.root.message}
        </p>
      ) : null}
      <AdminButton type="submit" pending={form.formState.isSubmitting} className="self-start">
        {translate(errors.root?.type === "offline" ? "common.noConnection" : "admin.createRole")}
      </AdminButton>
    </form>
  );
}
