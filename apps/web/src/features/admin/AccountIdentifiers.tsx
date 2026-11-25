"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import { normaliseIdentifier, normalisePhone } from "@keoshaa/core";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { identifierAddSchema, type IdentifierAddValues } from "./account-schemas";
import { useAddIdentifier, useRemoveIdentifier } from "./account-detail-api";
import { AdminButton, AdminTextInput } from "./admin-ui";
import { BodyRow, ColumnCell, ColumnHead, DataTable, HeadRow, StatusPill } from "./DataTable";
import { formatDay, formatPhone } from "./format";

type User = components["schemas"]["UserRead"];
type Identifier = components["schemas"]["IdentifierRead"];
const KINDS = ["phone", "email", "username", "google"] as const;

const kindTone = {
  phone: "primary",
  email: "sky",
  username: "quiet",
  google: "quiet",
} as const;

const identifierError = {
  phone: "admin.invalidPhone",
  email: "admin.invalidEmail",
  username: "admin.invalidUsername",
  google: "admin.identifierRequired",
} as const;

function normalised(kind: IdentifierAddValues["kind"], raw: string): string | null {
  if (kind === "google") return raw.trim() || null;
  if (kind === "phone") return normalisePhone(raw);
  const parsed = normaliseIdentifier(raw);
  return parsed?.kind === kind ? parsed.value : null;
}

export function AccountIdentifiers({ user }: { user: User }) {
  const { locale, translate } = useMessages();
  const [adding, setAdding] = useState(false);
  const remove = useRemoveIdentifier(user.id);
  const last = user.identifiers.length <= 1;

  return (
    <section className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-admin-rule px-6 py-4">
        <h2 className="min-w-0 grow text-body font-semibold">{translate("admin.signInMethods")}</h2>
        <AdminButton tone="quiet" onClick={() => setAdding((open) => !open)}>
          {translate("admin.add")}
        </AdminButton>
      </div>
      <DataTable bare minWidth="min-w-150" roomy>
        <HeadRow>
          <ColumnHead>{translate("admin.kind")}</ColumnHead>
          <ColumnHead>{translate("admin.value")}</ColumnHead>
          <ColumnHead>{translate("admin.verified")}</ColumnHead>
          <ColumnHead align="right">
            <span className="sr-only">{translate("admin.actions")}</span>
          </ColumnHead>
        </HeadRow>
        <tbody>
          {user.identifiers.map((item) => (
            <IdentifierRow
              key={item.id}
              item={item}
              last={last}
              pending={remove.isPending && remove.variables === item.id}
              onRemove={() => void remove.mutate(item.id)}
              locale={locale}
            />
          ))}
        </tbody>
      </DataTable>
      {adding ? <AddIdentifier userId={user.id} onDone={() => setAdding(false)} /> : null}
    </section>
  );
}

function IdentifierRow({
  item,
  last,
  pending,
  onRemove,
  locale,
}: {
  item: Identifier;
  last: boolean;
  pending: boolean;
  onRemove: () => void;
  locale: "en" | "ne";
}) {
  const { translate } = useMessages();
  return (
    <BodyRow>
      <ColumnCell>
        <StatusPill tone={kindTone[item.kind]}>
          {translate(`admin.findByOption.${item.kind}`)}
        </StatusPill>
      </ColumnCell>
      <ColumnCell>
        <span
          className={
            item.kind === "phone" ? "font-medium tabular-nums" : "text-caption font-medium"
          }
        >
          {item.kind === "phone" ? formatPhone(item.value) : item.value}
        </span>
      </ColumnCell>
      <ColumnCell muted={!item.verified_at}>
        {item.verified_at ? (
          <span className="text-on-success-tint">{formatDay(item.verified_at, locale)}</span>
        ) : (
          "—"
        )}
      </ColumnCell>
      <ColumnCell align="right">
        <AdminButton
          type="button"
          tone={last ? "quiet" : "dangerQuiet"}
          size="sm"
          disabled={last}
          pending={pending}
          onClick={onRemove}
        >
          {translate(last ? "admin.lastOne" : "admin.remove")}
        </AdminButton>
      </ColumnCell>
    </BodyRow>
  );
}

function AddIdentifier({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { locale, translate } = useMessages();
  const add = useAddIdentifier(userId);
  const form = useForm<IdentifierAddValues>({
    resolver: zodResolver(identifierAddSchema),
    defaultValues: { kind: "phone", value: "" },
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const errors = form.formState.errors;

  return (
    <form
      noValidate
      className="flex flex-col gap-3 border-t border-admin-rule px-6 py-4"
      onSubmit={form.handleSubmit(async (values) => {
        const identifier = normalised(values.kind, values.value);
        if (!identifier) {
          form.setError("value", { message: identifierError[values.kind] });
          return;
        }
        try {
          await add.mutateAsync({ ...values, identifier });
          form.reset();
          onDone();
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ChoiceField
          label={translate("admin.kind")}
          value={kind}
          onChange={(event) =>
            form.setValue("kind", event.target.value as IdentifierAddValues["kind"], {
              shouldDirty: true,
            })
          }
        >
          {KINDS.map((item) => (
            <option key={item} value={item}>
              {translate(`admin.findByOption.${item}`)}
            </option>
          ))}
        </ChoiceField>
        <AdminTextInput
          label={translate("admin.value")}
          error={fieldText(errors.value?.message, translate)}
          {...form.register("value")}
        />
      </div>
      {errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errors.root.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2.5">
        <AdminButton type="submit" pending={form.formState.isSubmitting}>
          {translate(errors.root?.type === "offline" ? "common.noConnection" : "admin.add")}
        </AdminButton>
        <AdminButton type="button" tone="quiet" onClick={onDone}>
          {translate("admin.cancel")}
        </AdminButton>
      </div>
    </form>
  );
}
