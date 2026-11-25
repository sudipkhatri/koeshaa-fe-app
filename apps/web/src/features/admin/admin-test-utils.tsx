import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { HttpResponse } from "msw";
import type { ReactNode } from "react";

import { LocaleProvider } from "@/lib/locale";

export const LEAD_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9N8";

export function renderAdmin(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <LocaleProvider>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </LocaleProvider>,
  );
}

export function page<T>(data: T, nextCursor: string | null = null) {
  return HttpResponse.json({
    success: true,
    data,
    meta: { pagination: { limit: 20, next_cursor: nextCursor, has_more: nextCursor !== null } },
  });
}
