import { apiBaseUrl } from "@/lib/config";

import { createSessionCore } from "./core";
import type { SessionCore } from "./core";
import { createSecureTokenStore, secureDeviceIdentity } from "./token-store";

let shared: SessionCore | null = null;

/** The app's single session core: one token store, one refresh at a time. */
export function getSessionCore(): SessionCore {
  shared ??= createSessionCore({
    baseUrl: apiBaseUrl(),
    store: createSecureTokenStore(),
    device: secureDeviceIdentity,
  });
  return shared;
}
