import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { startConnectivityWatch } from "./connectivity";
import { LocaleProvider } from "./locale";
import type { Preferences } from "./preferences";
import { createQueryClient } from "./query";
import { ThemeProvider } from "./theme";
import { ToastProvider } from "./toast";

interface AppProvidersProps {
  initial: Preferences;
  children: ReactNode;
  /** Tests turn retries off so failures show at once. */
  retryQueries?: boolean;
}

/** Everything screens read from context except the session (see `SessionRoot`): server cache, theme, language, toasts. */
export function AppProviders({ initial, children, retryQueries = true }: AppProvidersProps) {
  const [queryClient] = useState(() => createQueryClient({ retry: retryQueries }));
  useEffect(() => startConnectivityWatch(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initial={initial.theme}>
        <LocaleProvider initial={initial.locale}>
          <ToastProvider>{children}</ToastProvider>
        </LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
