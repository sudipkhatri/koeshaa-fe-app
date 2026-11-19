const LOCAL_API = "http://localhost:8000";

/** Read at call time so tests can switch modes. `EXPO_PUBLIC_*` values ship in the app: no secrets. */
export function apiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (__DEV__) return configured || LOCAL_API;
  if (!configured) throw new Error("EXPO_PUBLIC_API_URL is required in release builds.");
  if (!configured.startsWith("https://")) {
    throw new Error("EXPO_PUBLIC_API_URL must use https in release builds.");
  }
  return configured;
}

/** Development only: `EXPO_PUBLIC_USE_MOCKS=1` runs every screen on the local demo data. */
export function isMockMode(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_USE_MOCKS === "1";
}

/** Development only: `EXPO_PUBLIC_START_AT_ONBOARDING=1` opens on the onboarding flow. */
export function startsAtOnboarding(): boolean {
  return __DEV__ && process.env.EXPO_PUBLIC_START_AT_ONBOARDING === "1";
}
