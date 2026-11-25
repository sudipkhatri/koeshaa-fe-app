"use client";

import type { components } from "@keoshaa/api-client";
import { useQueries } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { LIST_STALE_MS, requireData } from "./api";

type PageLocale = components["schemas"]["PageLocale"];
type SitePage = components["schemas"]["SitePageRead"];

/** Board order: Terms, Privacy, About. */
export const SITE_SLUGS = ["terms", "privacy", "about"] as const;

/** The latest published text of each page, in the language asked for. */
export function useSitePages(locale: PageLocale) {
  return useQueries({
    queries: SITE_SLUGS.map((slug) => ({
      queryKey: ["admin", "site-pages", slug, locale] as const,
      staleTime: LIST_STALE_MS,
      queryFn: async (): Promise<SitePage> => {
        const { data } = await api.GET("/api/v1/site-pages/{slug}", {
          params: { path: { slug }, query: { locale } },
        });
        return requireData(data);
      },
    })),
  });
}
