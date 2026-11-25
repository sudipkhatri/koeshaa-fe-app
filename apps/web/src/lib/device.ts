const DEVICE_KEY = "keoshaa.device-id";

/** A stable id for this browser profile. It is not a token. */
export function browserDeviceId(): string {
  const stored = window.localStorage.getItem(DEVICE_KEY);
  if (stored && stored.length >= 16 && stored.length <= 128) return stored;
  const created = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_KEY, created);
  return created;
}
