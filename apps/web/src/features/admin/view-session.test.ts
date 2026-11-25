import { afterEach, describe, expect, it } from "vitest";

import {
  clearViewSession,
  endViewSessionLocally,
  getViewAccessToken,
  getViewEndedNote,
  getViewSession,
  minutesLeft,
  startViewSession,
} from "./view-session";

afterEach(() => {
  clearViewSession();
});

describe("view session", () => {
  it("keeps the access token out of the public meta", () => {
    startViewSession({
      accessToken: "secret-token",
      userId: "u1",
      name: "Asha",
      expiresIn: 1800,
      readOnly: true,
    });
    expect(getViewSession()).toMatchObject({
      userId: "u1",
      name: "Asha",
      readOnly: true,
    });
    expect(getViewSession()).not.toHaveProperty("accessToken");
    expect(getViewAccessToken()).toBe("secret-token");
  });

  it("records an ended note when the session ends locally", () => {
    startViewSession({
      accessToken: "secret-token",
      userId: "u1",
      name: "Asha",
      expiresIn: 1800,
      readOnly: true,
    });
    const note = endViewSessionLocally();
    expect(note).toMatchObject({ userId: "u1", name: "Asha" });
    expect(note!.minutes).toBeGreaterThanOrEqual(1);
    expect(getViewSession()).toBeNull();
    expect(getViewAccessToken()).toBeNull();
    expect(getViewEndedNote()).toEqual(note);
  });

  it("counts minutes left from endsAt", () => {
    const now = Date.now();
    startViewSession({
      accessToken: "t",
      userId: "u1",
      name: "Asha",
      expiresIn: 120,
      readOnly: true,
    });
    const session = getViewSession()!;
    expect(minutesLeft(session, now)).toBe(2);
    expect(minutesLeft(session, session.endsAt + 1)).toBe(0);
  });
});
