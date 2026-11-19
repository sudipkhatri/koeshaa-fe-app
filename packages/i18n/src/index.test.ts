import { describe, expect, it } from "vitest";

import { en } from "./en";
import { t } from "./index";
import { ne } from "./ne";

function keys(node: object, prefix = ""): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : keys(value as object, `${prefix}${key}.`),
  );
}

function entries(node: object, prefix = ""): [string, string][] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[`${prefix}${key}`, value] as [string, string]]
      : entries(value as object, `${prefix}${key}.`),
  );
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("t", () => {
  it("returns the string for the locale", () => {
    expect(t("en", "app.name")).toBe("Keoshaa");
    expect(t("ne", "app.name")).toBe("केओशा");
  });

  it("fills parameters and leaves unknown ones visible", () => {
    expect(t("en", "errors.tooManyCodes", { time: "14:35" })).toBe(
      "Too many codes. Try again after 14:35.",
    );
    expect(t("en", "errors.tooManyCodes")).toContain("{time}");
  });

  it("has the same keys in every locale", () => {
    expect(keys(ne).sort()).toEqual(keys(en).sort());
  });

  it("uses the same {placeholders} for every key in en and ne", () => {
    const neByKey = new Map(entries(ne));
    const mismatches = entries(en)
      .filter(([key, text]) => {
        const other = neByKey.get(key);
        return other === undefined || placeholders(text).join() !== placeholders(other).join();
      })
      .map(([key]) => key);
    expect(mismatches).toEqual([]);
  });
});
