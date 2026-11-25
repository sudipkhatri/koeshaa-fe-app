import { fireEvent, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setAccessToken } from "@/lib/session";
import { API, server } from "@/test/server";

import { renderAdmin } from "./admin-test-utils";
import { SettingsScreen } from "./SettingsScreen";

function setting(key: string, description: string, value: number, updatedAt: string | null) {
  return {
    key,
    description,
    value,
    default: value,
    minimum: 0,
    maximum: 100,
    scope: "platform",
    is_default: updatedAt === null,
    updated_at: updatedAt,
  };
}

function names(): string[] {
  return screen.getAllByRole("link").map((link) => link.textContent ?? "");
}

describe("admin settings list", () => {
  beforeEach(() => setAccessToken("access-1"));
  afterEach(() => setAccessToken(null));

  it("sorts by key, searches the words, and has no pages", async () => {
    server.use(
      http.get(`${API}/api/v1/admin/settings`, () =>
        HttpResponse.json({
          success: true,
          data: [
            setting(
              "sparks.daily_cap",
              "Most Sparks a student can earn",
              60,
              "2026-11-01T04:00:00Z",
            ),
            setting("auth.device_limit", "Devices one account may use", 3, "2026-07-16T04:00:00Z"),
          ],
        }),
      ),
    );
    renderAdmin(<SettingsScreen />);
    expect(await screen.findByRole("columnheader", { name: "Key" })).toHaveProperty(
      "ariaSort",
      "ascending",
    );
    expect(names()).toEqual(["auth.device_limit", "sparks.daily_cap"]);
    expect(screen.getByText(/^16 Jul/)).toBeTruthy();
    expect(screen.getByText(/no pagination/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "spark" } });
    expect(names()).toEqual(["sparks.daily_cap"]);

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Changed" }));
    expect(screen.getByRole("columnheader", { name: "Changed" })).toHaveProperty(
      "ariaSort",
      "descending",
    );
    expect(names()).toEqual(["sparks.daily_cap", "auth.device_limit"]);
  });

  it("says grade-level settings are not in the API", async () => {
    server.use(
      http.get(`${API}/api/v1/admin/settings`, () =>
        HttpResponse.json({
          success: true,
          data: [setting("auth.device_limit", "Devices", 3, null)],
        }),
      ),
    );
    renderAdmin(<SettingsScreen />);
    await screen.findByRole("link", { name: "auth.device_limit" });
    fireEvent.click(screen.getByLabelText("Scope"));
    fireEvent.click(
      within(screen.getByRole("listbox")).getByRole("option", { name: "Grade level" }),
    );
    expect(await screen.findByRole("heading", { name: "No settings match" })).toBeTruthy();
    expect(screen.getByText(/grade-level settings/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: "auth.device_limit" })).toBeNull();
  });
});
