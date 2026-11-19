import { useQuery } from "@tanstack/react-query";

import { isApiError } from "@keoshaa/core";
import type { ApiClient } from "@keoshaa/api-client";

import { useLocale } from "@/lib/locale";
import { keys } from "@/lib/query";
import { useApi } from "@/features/session/use-api";

export type LegalSlug = "terms" | "privacy";

export interface LegalPage {
  title: string;
  body: string;
  version: string;
}

/** The backend's configured version until staff publish a page (sign-in guide: consents). */
export const FALLBACK_CONSENT_VERSION = "2026-10";

async function loadPage(
  api: ApiClient,
  slug: LegalSlug,
  locale: string,
): Promise<LegalPage | null> {
  try {
    const { data } = await api.GET("/api/v1/site-pages/{slug}", {
      params: { path: { slug }, query: { locale: locale === "ne" ? "ne" : "en" } },
    });
    const page = data?.data;
    return page ? { title: page.title, body: page.body, version: page.version } : null;
  } catch (error) {
    if (isApiError(error, "PAGE_NOT_FOUND")) return null;
    throw error;
  }
}

/** The published page, or `null` when staff have not published it yet (then the app shows its summary). */
export function useLegalPage(slug: LegalSlug, enabled = true) {
  const api = useApi();
  const { locale } = useLocale();
  return useQuery({
    queryKey: keys.page(slug, locale),
    enabled,
    // Published pages never change (a new version is a new row): keep them a day.
    staleTime: 24 * 60 * 60_000,
    queryFn: () => (api ? loadPage(api, slug, locale) : Promise.resolve(null)),
  });
}

/** The versions to send with sign-up: the newest published English pages, else the configured ones. */
export async function currentConsentVersions(api: ApiClient) {
  const [terms, privacy] = await Promise.all([
    loadPage(api, "terms", "en"),
    loadPage(api, "privacy", "en"),
  ]);
  return {
    termsVersion: terms?.version ?? FALLBACK_CONSENT_VERSION,
    privacyVersion: privacy?.version ?? FALLBACK_CONSENT_VERSION,
  };
}
