import type { Locale } from "@keoshaa/i18n";
import NepaliDate from "nepali-date-converter";

const ZONE = "Asia/Kathmandu";

function parse(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function kathmanduParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

/** Today's calendar date in Kathmandu, as YYYY-MM-DD. */
export function kathmanduDate(now: Date = new Date()): string {
  const { year, month, day } = kathmanduParts(now);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function bikramSambat(date: Date): NepaliDate {
  const { year, month, day } = kathmanduParts(date);
  return NepaliDate.fromAD(new Date(year, month - 1, day));
}

function time(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ne" ? "ne-NP" : "en-GB", {
    timeStyle: "short",
    timeZone: ZONE,
  }).format(date);
}

/** Day and month in Kathmandu; the year only when it is not this year. Nepali uses Bikram Sambat. */
export function formatDay(iso: string, locale: Locale, now: Date = new Date()): string {
  const date = parse(iso);
  if (!date) return iso;
  if (locale === "ne") {
    const sameYear = bikramSambat(date).getYear() === bikramSambat(now).getYear();
    return bikramSambat(date).format(sameYear ? "D MMMM" : "D MMMM YYYY", "np");
  }
  const sameYear = kathmanduParts(date).year === kathmanduParts(now).year;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: ZONE,
  }).format(date);
}

/** Whole days from now until an instant, never below zero. */
export function daysUntil(iso: string, now: Date = new Date()): number | null {
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - now.getTime()) / 86_400_000));
}

/** Clock time in Kathmandu, for the active language. */
export function formatTime(iso: string, locale: Locale): string {
  const date = parse(iso);
  if (!date) return iso;
  return time(date, locale);
}

/** Full date and time in Kathmandu, for the active language. */
export function formatWhen(iso: string, locale: Locale): string {
  const date = parse(iso);
  if (!date) return iso;
  if (locale === "ne")
    return `${bikramSambat(date).format("D MMMM YYYY", "np")}, ${time(date, locale)}`;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ZONE,
  }).format(date);
}

/** "+9779800000044" → "+977 9800000044". */
export function formatPhone(phone: string): string {
  return phone.startsWith("+977") ? `+977 ${phone.slice(4)}` : phone;
}

/** How long something has been waiting ("2 days", "6 hours"), in the active language. */
export function formatWait(iso: string, locale: Locale, now: Date = new Date()): string {
  const date = parse(iso);
  if (!date) return iso;
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  const [value, unit] =
    minutes < 60
      ? [minutes, "minute"]
      : minutes < 60 * 24
        ? [Math.round(minutes / 60), "hour"]
        : [Math.round(minutes / (60 * 24)), "day"];
  return new Intl.NumberFormat(locale === "ne" ? "ne-NP" : "en", {
    style: "unit",
    unit,
    unitDisplay: "long",
  }).format(value);
}
