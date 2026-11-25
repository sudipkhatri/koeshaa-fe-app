"use client";

import type { components } from "@keoshaa/api-client";
import { useState } from "react";

import { ContentSkeleton } from "@/components/ui/Skeleton";
import { useMessages } from "@/lib/locale";

import { AdminButton, ApiTag } from "./admin-ui";
import { AdminIcon } from "./AdminIcon";
import { AdminPage } from "./AdminPage";
import { SitePageForm } from "./SitePageForm";
import { SITE_SLUGS, useSitePages } from "./site-pages-api";

type PageSlug = components["schemas"]["PageSlug"];
type PageLocale = components["schemas"]["PageLocale"];

const FORM_ID = "site-page";

export function SitePageScreen() {
  const { translate } = useMessages();
  const [slug, setSlug] = useState<PageSlug>("terms");
  const [pageLocale, setPageLocale] = useState<PageLocale>("en");
  const queries = useSitePages(pageLocale);
  const selected = queries[SITE_SLUGS.indexOf(slug)];
  const loaded = selected?.data?.locale === pageLocale ? selected.data : null;

  return (
    <AdminPage
      title={translate("admin.sitePages")}
      actions={
        <>
          <span className="inline-flex items-center gap-2">
            <AdminButton tone="quiet" disabled>
              {translate("admin.preview")}
            </AdminButton>
            <ApiTag />
          </span>
          <AdminButton
            onClick={() => {
              const form = document.getElementById(FORM_ID);
              if (form instanceof HTMLFormElement) form.requestSubmit();
            }}
          >
            {translate("admin.publish")}
          </AdminButton>
        </>
      }
    >
      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-label={translate("admin.pages")}
          className="flex w-full shrink-0 flex-col gap-1.5 self-start rounded-xl border border-admin-border bg-admin-surface p-3.5 sm:w-65"
        >
          <h2 className="px-2 pt-1 pb-2 text-micro font-semibold tracking-widest text-admin-soft uppercase">
            {translate("admin.pages")}
          </h2>
          {SITE_SLUGS.map((item, index) => {
            const query = queries[index];
            const page = query?.data?.locale === pageLocale ? query.data : null;
            const current = item === slug;
            return (
              <button
                key={item}
                type="button"
                aria-current={current ? "page" : undefined}
                className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left ${current ? "bg-primary-tint font-semibold text-admin-on-tint" : "text-admin-ink"}`}
                onClick={() => setSlug(item)}
              >
                <span className="min-w-0 grow">{translate(`admin.pageSlug.${item}`)}</span>
                <span className={`text-micro tabular-nums ${current ? "" : "text-admin-soft"}`}>
                  {query?.isPending ? translate("ui.loading") : (page?.version ?? "—")}
                </span>
              </button>
            );
          })}
          <div
            role="group"
            aria-label={translate("admin.pageLanguage")}
            className="mt-2.5 flex gap-0.5 rounded-lg bg-admin-page p-0.75"
          >
            {(["en", "ne"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={pageLocale === item}
                className={`min-h-12 grow cursor-pointer rounded-md px-2 text-caption font-semibold md:h-8 md:min-h-0 ${pageLocale === item ? "bg-admin-surface text-admin-ink" : "text-admin-soft"}`}
                onClick={() => setPageLocale(item)}
              >
                {translate(item === "en" ? "auth.english" : "auth.nepali")}
              </button>
            ))}
          </div>
        </section>
        <div className="flex min-w-0 grow basis-115 flex-col gap-4">
          <div className="flex gap-3 rounded-xl bg-sky-tint px-4 py-3.5 text-on-sky-tint">
            <AdminIcon name="info" className="mt-px size-5 shrink-0" />
            <p>{translate("admin.publishVersions")}</p>
          </div>
          {selected?.isPending ? (
            <ContentSkeleton label={translate("ui.loading")} />
          ) : (
            <SitePageForm
              key={`${slug}-${pageLocale}-${loaded?.id ?? "new"}`}
              id={FORM_ID}
              slug={slug}
              pageLocale={pageLocale}
              page={loaded}
              loadError={loaded ? undefined : selected?.error}
              onSlug={setSlug}
              onLocale={setPageLocale}
              onRetry={() => void selected?.refetch()}
            />
          )}
        </div>
      </div>
    </AdminPage>
  );
}
