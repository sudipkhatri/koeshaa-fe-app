"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput } from "./admin-ui";
import { AdminIcon } from "./AdminIcon";
import { useCreateWebhook } from "./api";
import { webhookCreateSchema, type WebhookCreateValues } from "./schemas";

const FORMATS = ["generic", "slack", "teams"] as const;

export const ADD_WEBHOOK_ID = "add-webhook";

export function SigningSecret({ secret, onDone }: { secret: string; onDone: () => void }) {
  const { translate } = useMessages();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="flex gap-3.5 rounded-xl bg-reward-tint p-4.5 text-on-reward-tint" role="status">
      <AdminIcon name="alert" className="size-5 shrink-0" />
      <div className="flex min-w-0 grow flex-col gap-2.5">
        <p className="font-semibold">{translate("admin.secretOnce")}</p>
        <div className="flex items-center gap-2 rounded-square bg-admin-surface px-3 py-2.5">
          <code className="min-w-0 grow text-caption break-all text-admin-ink">{secret}</code>
          <button
            type="button"
            className="inline-flex min-h-12 shrink-0 cursor-pointer items-center rounded-md bg-on-reward-tint px-3 text-caption font-semibold text-reward-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-7.5"
            onClick={() => void copy()}
          >
            {translate(copied ? "admin.copied" : "admin.copy")}
          </button>
        </div>
        {failed ? (
          <p role="alert" className="text-caption">
            {translate("admin.copyFailed")}
          </p>
        ) : null}
        <AdminButton tone="quiet" size="sm" className="self-start" onClick={onDone}>
          {translate("admin.dismissSecret")}
        </AdminButton>
      </div>
    </div>
  );
}

export function AddWebhook({ onCreated }: { onCreated: (secret: string) => void }) {
  const { locale, translate } = useMessages();
  const create = useCreateWebhook();
  const form = useForm<WebhookCreateValues>({
    resolver: zodResolver(webhookCreateSchema),
    defaultValues: { name: "", url: "", format: "generic", events: "" },
  });
  const format = useWatch({ control: form.control, name: "format" });
  const errors = form.formState.errors;

  return (
    <section
      id={ADD_WEBHOOK_ID}
      aria-labelledby={`${ADD_WEBHOOK_ID}-title`}
      className="flex flex-col gap-4.5 rounded-xl border border-admin-border bg-admin-surface px-6 py-5.5"
    >
      <h2 id={`${ADD_WEBHOOK_ID}-title`} className="text-body font-semibold">
        {translate("admin.addWebhook")}
      </h2>
      <form
        noValidate
        className="flex flex-col items-start gap-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            onCreated((await create.mutateAsync(values)).signing_secret);
            form.reset();
          } catch (error) {
            recordFormFailure(error, form.setError, translate, locale);
          }
        })}
      >
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminTextInput
            label={translate("admin.name")}
            maxLength={100}
            placeholder={translate("admin.webhookNameExample")}
            error={fieldText(errors.name?.message, translate)}
            {...form.register("name")}
          />
          <ChoiceField
            label={translate("admin.format")}
            {...form.register("format")}
            value={format}
          >
            {FORMATS.map((item) => (
              <option key={item} value={item}>
                {translate(`admin.webhookFormat.${item}`)}
              </option>
            ))}
          </ChoiceField>
          <AdminTextInput
            className="sm:col-span-2"
            type="url"
            label={translate("admin.url")}
            placeholder={translate("admin.urlExample")}
            hint={translate("admin.urlSecretHint")}
            error={fieldText(errors.url?.message, translate)}
            {...form.register("url")}
          />
          <AdminTextInput
            className="sm:col-span-2"
            label={translate("admin.events")}
            placeholder={translate("admin.eventsExample")}
            hint={translate("admin.eventsHint")}
            error={fieldText(errors.events?.message, translate)}
            {...form.register("events")}
          />
        </div>
        {errors.root?.message ? (
          <p role="alert" className="text-caption text-admin-danger">
            {errors.root.message}
          </p>
        ) : null}
        <AdminButton type="submit" size="lg" pending={form.formState.isSubmitting}>
          {translate(errors.root?.type === "offline" ? "common.noConnection" : "admin.addWebhook")}
        </AdminButton>
      </form>
    </section>
  );
}
