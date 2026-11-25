"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { consentSchema, type ConsentValues } from "./account-schemas";
import { useAdminUser, useConsents, useRecordConsent } from "./account-detail-api";
import { AdminButton, AdminTextInput } from "./admin-ui";
import { BodyRow, ColumnCell, ColumnHead, DataTable, HeadRow, StatusPill } from "./DataTable";
import { formatDay } from "./format";
import { QueryGate } from "./QueryGate";

type Consent = components["schemas"]["ConsentRead"];

export function AccountConsents({ userId }: { userId: string }) {
  const { translate } = useMessages();
  const consents = useConsents(userId);
  const rows = consents.data ?? [];
  const [recording, setRecording] = useState(false);

  return (
    <section className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-admin-rule px-6 py-4">
        <h2 className="min-w-0 grow text-body font-semibold">{translate("admin.consents")}</h2>
        <AdminButton tone="quiet" onClick={() => setRecording((open) => !open)}>
          {translate("admin.recordConsent")}
        </AdminButton>
      </div>
      <QueryGate
        query={consents}
        isEmpty={rows.length === 0 && !recording}
        emptyTitle="admin.emptyConsents"
        emptyMessage="admin.emptyConsentsBody"
        inset
      >
        {rows.length > 0 ? (
          <DataTable bare minWidth="min-w-160" roomy>
            <HeadRow>
              <ColumnHead>{translate("admin.document")}</ColumnHead>
              <ColumnHead>{translate("admin.version")}</ColumnHead>
              <ColumnHead>{translate("admin.givenBy")}</ColumnHead>
              <ColumnHead align="right">{translate("admin.when")}</ColumnHead>
            </HeadRow>
            <tbody>
              {rows.map((row) => (
                <ConsentRow
                  key={`${row.document}-${row.version}-${row.given_at}`}
                  userId={userId}
                  row={row}
                />
              ))}
            </tbody>
          </DataTable>
        ) : null}
      </QueryGate>
      {recording ? <RecordConsent userId={userId} onDone={() => setRecording(false)} /> : null}
    </section>
  );
}

function ConsentRow({ userId, row }: { userId: string; row: Consent }) {
  const { locale, translate } = useMessages();
  return (
    <BodyRow>
      <ColumnCell>
        <span className="inline-flex flex-wrap items-center gap-1.5 font-medium">
          {translate(`admin.pageSlug.${row.document}`)}
          <StatusPill tone={row.current ? "success" : "reward"}>
            {translate(row.current ? "admin.current" : "admin.superseded")}
          </StatusPill>
        </span>
      </ColumnCell>
      <ColumnCell muted>
        <span className="tabular-nums">{row.version}</span>
      </ColumnCell>
      <ColumnCell muted>
        <GivenBy userId={userId} givenBy={row.given_by} />
      </ColumnCell>
      <ColumnCell align="right" muted>
        {formatDay(row.given_at, locale)}
      </ColumnCell>
    </BodyRow>
  );
}

function GivenBy({ userId, givenBy }: { userId: string; givenBy: string }) {
  const { translate } = useMessages();
  const person = useAdminUser(givenBy);
  const name = person.data?.name ?? givenBy;
  if (givenBy === userId) return name;
  return translate("admin.consentBy", { name });
}

function RecordConsent({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { locale, translate } = useMessages();
  const record = useRecordConsent(userId);
  const form = useForm<ConsentValues>({
    resolver: zodResolver(consentSchema),
    defaultValues: { document: "terms", version: "", givenBy: "" },
  });
  const document = useWatch({ control: form.control, name: "document" });
  const errors = form.formState.errors;

  return (
    <form
      noValidate
      className="flex flex-col gap-3 border-t border-admin-rule px-6 py-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await record.mutateAsync(values);
          form.reset();
          onDone();
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ChoiceField
          label={translate("admin.document")}
          value={document}
          onChange={(event) =>
            form.setValue("document", event.target.value as ConsentValues["document"], {
              shouldDirty: true,
            })
          }
        >
          <option value="terms">{translate("admin.pageSlug.terms")}</option>
          <option value="privacy">{translate("admin.pageSlug.privacy")}</option>
        </ChoiceField>
        <AdminTextInput
          label={translate("admin.version")}
          error={fieldText(errors.version?.message, translate)}
          {...form.register("version")}
        />
        <AdminTextInput
          label={translate("admin.givenBy")}
          hint={translate("admin.givenByHint")}
          error={fieldText(errors.givenBy?.message, translate)}
          {...form.register("givenBy")}
        />
      </div>
      {errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errors.root.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2.5">
        <AdminButton type="submit" pending={form.formState.isSubmitting}>
          {translate(
            errors.root?.type === "offline" ? "common.noConnection" : "admin.recordConsent",
          )}
        </AdminButton>
        <AdminButton type="button" tone="quiet" onClick={onDone}>
          {translate("admin.cancel")}
        </AdminButton>
      </div>
    </form>
  );
}
