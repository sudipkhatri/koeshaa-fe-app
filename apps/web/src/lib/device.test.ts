import { beforeEach, describe, expect, it } from "vitest";

import { browserDeviceId } from "./device";

describe("browserDeviceId", () => {
  beforeEach(() => window.localStorage.clear());

  it("keeps one id for this browser profile", () => {
    const first = browserDeviceId();
    expect(browserDeviceId()).toBe(first);
    expect(first.length).toBeGreaterThanOrEqual(16);
  });
});
