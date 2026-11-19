import { parseCodeParams, parseStreamGrade } from "@/features/onboarding/route-params";

import { chapterRefSchema, contentRefSchema, routeParam } from "./route-params";

describe("code route params", () => {
  it("accepts a real step", () => {
    expect(parseCodeParams({ to: "a•••@x.com", child: "1", next: "reset" })).toEqual({
      to: "a•••@x.com",
      toParent: true,
      next: "reset",
    });
  });

  it("sends an unknown step back to the start", () => {
    expect(parseCodeParams({ to: "x", next: "admin" })).toBeNull();
    expect(parseCodeParams({})).toBeNull();
  });

  it("ignores a destination that is not masked", () => {
    expect(parseCodeParams({ to: "evil@x.com", next: "signup" })?.to).toBe("");
  });

  it("uses the first of repeated keys", () => {
    expect(parseCodeParams({ next: ["signup", "reset"] })?.next).toBe("signup");
  });
});

describe("other route params", () => {
  it("falls back to Class 11 for streams", () => {
    expect(parseStreamGrade("12")).toBe(12);
    expect(parseStreamGrade("7")).toBe(11);
    expect(parseStreamGrade(undefined)).toBe(11);
  });

  it("parses content and chapter references strictly", () => {
    expect(routeParam(contentRefSchema).parse("maths:1:2")).toEqual({
      subjectId: "maths",
      chapter: 1,
      topic: 2,
    });
    expect(routeParam(contentRefSchema).safeParse("maths:1").success).toBe(false);
    expect(routeParam(contentRefSchema).safeParse("../x:1:2").success).toBe(false);
    expect(routeParam(chapterRefSchema).parse(["maths:3"])).toEqual({
      subjectId: "maths",
      index: 3,
    });
    expect(routeParam(chapterRefSchema).safeParse(undefined).success).toBe(false);
  });
});
