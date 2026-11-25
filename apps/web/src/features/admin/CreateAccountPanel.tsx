"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import { normaliseIdentifier, normalisePhone } from "@keoshaa/core";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { accountCreateSchema, type AccountCreateValues } from "./account-schemas";
import { useCreateAccount } from "./accounts-api";
import { AdminButton, AdminTextInput } from "./admin-ui";

type User = components["schemas"]["UserRead"];

const KINDS = ["member", "staff"] as const;
const IDENTIFIERS = ["phone", "email", "username"] as const;

const identifierError = {
  phone: "admin.invalidPhone",
  email: "admin.invalidEmail",
  username: "admin.invalidUsername",
} as const;

function normalised(kind: AccountCreateValues["identifierKind"], raw: string): string | null {
  if (kind === "phone") return normalisePhone(raw);
  const parsed = normaliseIdentifier(raw);
  return parsed?.kind === kind ? parsed.value : null;
}

export function CreateAccountPanel({
  id,
  onCreated,
  onCancel,
}: {
  id: string;
  onCreated: (user: User) => void;
  onCancel: () => void;
}) {
  const { locale, translate } = useMessages();
  const create = useCreateAccount();
  const form = useForm<AccountCreateValues>({
    resolver: zodResolver(accountCreateSchema),
    defaultValues: { name: "", accountKind: "member", identifierKind: "phone", identifier: "" },
  });
  const accountKind = useWatch({ control: form.control, name: "accountKind" });
  const identifierKind = useWatch({ control: form.control, name: "identifierKind" });
  const errors = form.formState.errors;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4.5 rounded-xl border border-admin-border bg-admin-surface px-6 py-5.5"
    >
      <h2 id={`${id}-title`} className="text-body font-semibold">
        {translate("admin.createAccount")}
      </h2>
      <form
        noValidate
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          const identifier = normalised(values.identifierKind, values.identifier);
          if (!identifier) {
            form.setError("identifier", { message: identifierError[values.identifierKind] });
            return;
          }
          try {
            onCreated(await create.mutateAsync({ ...values, identifier, locale }));
          } catch (error) {
            recordFormFailure(error, form.setError, translate, locale);
          }
        })}
      >
        <AdminTextInput
          label={translate("admin.name")}
          maxLength={200}
          error={fieldText(errors.name?.message, translate)}
          {...form.register("name")}
        />
        <ChoiceField
          label={translate("admin.accountKind")}
          {...form.register("accountKind")}
          value={accountKind}
        >
          {KINDS.map((item) => (
            <option key={item} value={item}>
              {translate(`admin.userKind.${item}`)}
            </option>
          ))}
        </ChoiceField>
        <ChoiceField
          label={translate("admin.signsInWith")}
          {...form.register("identifierKind")}
          value={identifierKind}
        >
          {IDENTIFIERS.map((item) => (
            <option key={item} value={item}>
              {translate(`admin.findByOption.${item}`)}
            </option>
          ))}
        </ChoiceField>
        <AdminTextInput
          label={translate(
            identifierKind === "phone"
              ? "admin.phoneNumber"
              : identifierKind === "email"
                ? "admin.emailAddress"
                : "admin.username",
          )}
          error={fieldText(errors.identifier?.message, translate)}
          {...form.register("identifier")}
        />
        {errors.root?.message ? (
          <p role="alert" className="text-caption text-admin-danger sm:col-span-2">
            {errors.root.message}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <AdminButton type="submit" size="lg" pending={form.formState.isSubmitting}>
            {translate(
              errors.root?.type === "offline" ? "common.noConnection" : "admin.createAccount",
            )}
          </AdminButton>
          <AdminButton tone="quiet" size="lg" onClick={onCancel}>
            {translate("admin.cancel")}
          </AdminButton>
        </div>
      </form>
    </section>
  );
}
