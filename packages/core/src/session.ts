/**
 * How each app keeps a signing-in session (backend ADR 0013). Implementations live in the apps:
 * mobile keeps the refresh token in secure storage; the web keeps it in an `HttpOnly` cookie and
 * never sees it. The access token lives in memory only.
 */

export interface Tokens {
  readonly accessToken: string;
  /** Mobile only; the web gets a cookie instead. */
  readonly refreshToken?: string | null;
  readonly expiresInSeconds: number;
}

export interface TokenStore {
  getAccessToken(): string | null;
  setTokens(tokens: Tokens): Promise<void>;
  /** Mobile: from secure storage. Web: null (the browser sends the cookie). */
  getRefreshToken(): Promise<string | null>;
  clear(): Promise<void>;
}

/** A random id created once per install (mobile) or browser profile (web); never personal data. */
export interface DeviceIdentity {
  getDeviceId(): Promise<string>;
}
