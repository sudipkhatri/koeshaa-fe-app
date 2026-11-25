"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import { ApiError, NetworkError } from "@keoshaa/core";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { StateView } from "@/components/ui/StateView";
import { recordFormFailure, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput, ApiTag } from "./admin-ui";
import { MarkdownEditor } from "./MarkdownEditor";
import { usePublishSitePage } from "./api";
import { formatDay } from "./format";
import { SITE_SLUGS } from "./site-pages-api";
import { sitePageSchema, type SitePageValues } from "./schemas";

type SitePage = components["schemas"]["SitePageRead"];
type PageSlug = components["schemas"]["PageSlug"];
type PageLocale = components["schemas"]["PageLocale"];
type TextValues = Pick<SitePageValues, "version" | "title" | "body">;

const textSchema = sitePageSchema.pick({ version: true, title: true, body: true });
const LOCALES = ["en", "ne"] as const;

export function SitePageForm({
  id,
  slug,
  pageLocale,
  page,
  loadError,
  onSlug,
  onLocale,
  onRetry,
}: {
  id: string;
  slug: PageSlug;
  pageLocale: PageLocale;
  page: SitePage | null;
  loadError: unknown;
  onSlug: (slug: PageSlug) => void;
  onLocale: (locale: PageLocale) => void;
  onRetry: () => void;
}) {
  const { locale, translate } = useMessages();
  const bodyId = useId();
  const publish = usePublishSitePage();
  const form = useForm<TextValues>({
    resolver: zodResolver(textSchema),
    defaultValues: {
      version: page?.version ?? "",
      title: page?.title ?? "",
      body: page?.body ?? "",
    },
  });
  const errors = form.formState.errors;
  const missing = loadError instanceof ApiError && loadError.status === 404;

  return (
    <form
      id={id}
      aria-label={translate("admin.publish")}
      noValidate
      className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface px-6 py-5.5"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const saved = await publish.mutateAsync({ ...values, slug, locale: pageLocale });
          form.reset({ ...values, version: "", title: saved.title, body: saved.body });
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      {loadError instanceof NetworkError ? (
        <StateView
          title={translate("state.offlineTitle")}
          message={translate("state.offlineMessage")}
          retryLabel={translate("ui.retry")}
          onRetry={onRetry}
        />
      ) : loadError instanceof ApiError && loadError.status === 403 ? (
        <StateView title={translate("errors.FORBIDDEN")} message={translate("errors.FORBIDDEN")} />
      ) : loadError instanceof ApiError && !missing ? (
        <StateView
          title={translate("state.errorTitle")}
          message={translate("state.errorMessage")}
          retryLabel={translate("ui.retry")}
          onRetry={onRetry}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChoiceField
          label={translate("admin.slug")}
          value={slug}
          onChange={(event) => onSlug(event.target.value as PageSlug)}
        >
          {SITE_SLUGS.map((item) => (
            <option key={item} value={item}>
              {translate(`admin.pageSlug.${item}`)}
            </option>
          ))}
        </ChoiceField>
        <ChoiceField
          label={translate("admin.pageLanguage")}
          value={pageLocale}
          onChange={(event) => onLocale(event.target.value as PageLocale)}
        >
          {LOCALES.map((item) => (
            <option key={item} value={item}>
              {translate(item === "en" ? "auth.english" : "auth.nepali")}
            </option>
          ))}
        </ChoiceField>
        <AdminTextInput
          label={translate("admin.version")}
          error={fieldText(errors.version?.message, translate)}
          {...form.register("version")}
        />
      </div>
      <AdminTextInput
        label={translate("admin.pageTitle")}
        error={fieldText(errors.title?.message, translate)}
        strong
        {...form.register("title")}
      />
      <Controller
        name="body"
        control={form.control}
        render={({ field }) => (
          <MarkdownEditor
            id={bodyId}
            label={translate("admin.bodyMarkdown")}
            value={field.value}
            error={fieldText(errors.body?.message, translate)}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      {errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errors.root.message}
        </p>
      ) : null}
      {publish.isSuccess ? (
        <p role="status" className="text-caption text-admin-soft">
          {translate("admin.published", { title: publish.data.title })}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <AdminButton type="submit" size="lg" pending={form.formState.isSubmitting}>
          {translate(errors.root?.type === "offline" ? "common.noConnection" : "admin.publish")}
        </AdminButton>
        <AdminButton type="button" tone="quiet" size="lg" disabled>
          {translate("admin.saveDraft")}
        </AdminButton>
        <ApiTag />
        {page ? (
          <p className="text-caption text-admin-soft">
            {translate("admin.lastPublished", { date: formatDay(page.published_at, locale) })}
          </p>
        ) : missing || !loadError ? (
          <p className="text-caption text-admin-soft">{translate("admin.noPublishedVersion")}</p>
        ) : null}
        {page ? <ApiTag /> : null}
      </div>
    </form>
  );
}
