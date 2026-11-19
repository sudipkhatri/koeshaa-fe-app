import type { DeviceIdentity, TokenStore, Tokens } from "@keoshaa/core";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const REFRESH_KEY = "keoshaa.refresh";
const DEVICE_KEY = "keoshaa.device";

/** Access token in memory only; refresh token in the device's secure storage (security.md). */
export function createSecureTokenStore(): TokenStore {
  let accessToken: string | null = null;
  return {
    getAccessToken: () => accessToken,
    async setTokens(tokens: Tokens) {
      accessToken = tokens.accessToken;
      if (tokens.refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
    },
    getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
    async clear() {
      accessToken = null;
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    },
  };
}

/** A random id created once per install; never personal data. */
export const secureDeviceIdentity: DeviceIdentity = {
  async getDeviceId() {
    const existing = await SecureStore.getItemAsync(DEVICE_KEY);
    if (existing) return existing;
    const created = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_KEY, created);
    return created;
  },
};
