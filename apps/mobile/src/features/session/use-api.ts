import type { ApiClient } from "@keoshaa/api-client";

import { useSession } from "./session";

/** The typed client for hooks that talk to the backend; `null` in mock mode (demo data). */
export function useApi(): ApiClient | null {
  return useSession().core?.api ?? null;
}
