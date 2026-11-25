import { describe, expect, it } from "vitest";

import { daysUntil, formatDay, formatPhone, formatTime, formatWait, formatWhen } from "./format";

const NOW = new Date("2026-11-25T03:00:00Z");

describe("admin dates", () => {
  it("shows day and month in English, in Kathmandu time", () => {
    expect(formatDay("2026-11-24T20:00:00Z", "en", NOW)).toBe("25 Nov");
  });

  it("adds the year when it is not this year", () => {
    expect(formatDay("2025-03-02T06:00:00Z", "en", NOW)).toBe("2 Mar 2025");
  });

  it("uses the Bikram Sambat calendar in Nepali", () => {
    expect(formatDay("2026-11-25T03:00:00Z", "ne", NOW)).toBe("९ मंसिर");
    expect(formatWhen("2026-11-25T03:00:00Z", "ne")).toContain("९ मंसिर २०८३");
  });

  it("counts whole days until a closing date", () => {
    expect(daysUntil("2026-12-13T03:00:00Z", NOW)).toBe(18);
    expect(daysUntil("not-a-date", NOW)).toBeNull();
  });

  it("shows the Kathmandu clock time", () => {
    expect(formatTime("2026-11-25T01:27:00Z", "en")).toBe("07:12");
  });

  it("says how long something has waited without 'ago'", () => {
    expect(formatWait("2026-11-23T03:00:00Z", "en", NOW)).toBe("2 days");
    expect(formatWait("2026-11-24T21:00:00Z", "en", NOW)).toBe("6 hours");
  });

  it("spaces the Nepal country code", () => {
    expect(formatPhone("+9779800000044")).toBe("+977 9800000044");
    expect(formatPhone("01-4000000")).toBe("01-4000000");
  });
});
