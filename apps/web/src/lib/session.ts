/** The access token in memory only: never in localStorage or a readable cookie. */
let current: string | null = null;

export function accessToken(): string | null {
  return current;
}

export function setAccessToken(token: string | null): void {
  current = token;
}
