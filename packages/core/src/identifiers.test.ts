import { describe, expect, it } from "vitest";

import { detectIdentifier, normaliseIdentifier, normalisePhone } from "./identifiers";

describe("phone numbers (ACC-7.1)", () => {
  it.each([
    ["9801234567", "+9779801234567"],
    ["+977 980-123 4567", "+9779801234567"],
    ["09801234567", "+9779801234567"],
    ["977 9812345678", "+9779812345678"],
  ])("%s is the same account as %s", (raw, expected) => {
    expect(normalisePhone(raw)).toBe(expected);
  });

  it("refuses numbers that are not Nepal mobiles", () => {
    expect(normalisePhone("1234567890")).toBeNull();
  });
});

describe("the one sign-in box", () => {
  it.each([
    ["9801234567", "phone"],
    ["Asha@Example.com", "email"],
    ["nima.rai", "username"],
  ])("%s is a %s", (raw, kind) => {
    expect(detectIdentifier(raw)).toBe(kind);
  });

  it("normalises emails and usernames to lower case", () => {
    expect(normaliseIdentifier("Asha@Example.com")).toEqual({
      kind: "email",
      value: "asha@example.com",
    });
    expect(normaliseIdentifier("Nima.Rai")).toEqual({ kind: "username", value: "nima.rai" });
  });

  it("refuses invalid values", () => {
    expect(normaliseIdentifier("nope@")).toBeNull();
    expect(normaliseIdentifier("a")).toBeNull();
  });
});
