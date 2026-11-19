import type { MessageKey } from "@keoshaa/i18n";

const DAY_MS = 86_400_000;
const ACTIVE_MS = 5 * 60_000;

/** "Active now", "Yesterday", "3 days ago" in the active language. */
export function lastSeenLabel(
  iso: string,
  t: (key: MessageKey, params?: Readonly<Record<string, string | number>>) => string,
  formatNumber: (value: number) => string,
  now: number = Date.now(),
): string {
  const age = Math.max(0, now - new Date(iso).getTime());
  if (age < ACTIVE_MS) return t("devices.activeNow");
  const days = Math.floor(age / DAY_MS);
  if (days < 1) return t("devices.today");
  if (days === 1) return t("devices.yesterday");
  return t("devices.daysAgo", { n: formatNumber(days) });
}
