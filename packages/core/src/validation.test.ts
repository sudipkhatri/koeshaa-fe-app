import { describe, expect, it } from "vitest";

import { ApiError } from "./errors";
import { signInSchema } from "./validation";

describe("sign-in form", () => {
  it("accepts a phone and an 8-character password", () => {
    expect(signInSchema.safeParse({ identifier: "9801234567", password: "eight888" }).success).toBe(
      true,
    );
  });

  it("refuses a 7-character password with a message key", () => {
    const result = signInSchema.safeParse({ identifier: "9801234567", password: "seven77" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("password.tooShort");
  });
});

describe("ApiError", () => {
  it("keeps the code and maps field errors", () => {
    const error = new ApiError(400, {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: [{ field: "password", code: "too_short", message: "Too short" }],
    });
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.fieldErrors()).toEqual({ password: "Too short" });
  });
});
