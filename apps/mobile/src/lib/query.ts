import { ApiError } from "@keoshaa/core";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { shouldReport, shouldRetry } from "./errors";
import { reportError } from "./report";

/** Reports once per failed query or mutation (after retries); context carries no personal data. */
function reportFailure(source: "query" | "mutation", error: unknown): void {
  if (!shouldReport(error)) return;
  reportError(error, {
    source,
    ...(error instanceof ApiError
      ? {
          status: error.status,
          code: error.code,
          ...(error.requestId ? { requestId: error.requestId } : {}),
        }
      : {}),
  });
}

export function createQueryClient(options: { retry?: boolean } = {}): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: (error) => reportFailure("query", error) }),
    mutationCache: new MutationCache({ onError: (error) => reportFailure("mutation", error) }),
    defaultOptions: {
      queries: {
        retry: options.retry === false ? false : shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

/** One factory per feature so keys are never ad-hoc strings (data-fetching.md). */
export const keys = {
  me: ["me"] as const,
  devices: ["me", "devices"] as const,
  children: ["me", "children"] as const,
  childDevices: (childId: string) => ["me", "children", childId, "devices"] as const,
  invitations: ["me", "guardian-invitations"] as const,
  notifications: ["notifications"] as const,
  unreadCount: ["notifications", "unread"] as const,
  enrollments: ["me", "enrollments"] as const,
  dismissals: ["me", "prompts", "dismissals"] as const,
  academicYear: ["catalog", "academic-year"] as const,
  grades: ["catalog", "grade-levels"] as const,
  pool: (grade: string, stream: string | null) => ["catalog", "pool", grade, stream] as const,
  freeSlice: (grade: string, stream: string | null) =>
    ["catalog", "free-slice", grade, stream] as const,
  page: (slug: string, locale: string) => ["site-pages", slug, locale] as const,
};
