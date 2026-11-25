import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setAccessToken } from "@/lib/session";
import { API, server } from "@/test/server";

import { page, renderAdmin } from "./admin-test-utils";
import { SettingScreen } from "./SettingScreen";

const KEY = "enrollment.correction_days";
const USER_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9N8";

function setting(value: number) {
  return {
    key: KEY,
    description: "Days a student may still change class or subjects",
    value,
    default: 14,
    minimum: 0,
    maximum: 60,
    scope: "platform",
    is_default: value === 14,
    updated_at: "2026-10-28T08:17:00Z",
  };
}

function serve(value = 7) {
  server.use(
    http.get(`${API}/api/v1/admin/settings`, () =>
      HttpResponse.json({ success: true, data: [setting(value)] }),
    ),
    http.get(`${API}/api/v1/admin/settings/${KEY}/history`, () =>
      page([
        {
          changed_at: "2026-10-28T08:17:00Z",
          changed_by: USER_ID,
          changed_by_role: "super_admin",
          old_value: 7,
          new_value: 14,
        },
        {
          changed_at: "2026-07-16T03:45:00Z",
          changed_by: null,
          changed_by_role: null,
          old_value: 0,
          new_value: 7,
        },
      ]),
    ),
    http.get(`${API}/api/v1/users/${USER_ID}`, () =>
      HttpResponse.json({ success: true, data: { id: USER_ID, name: "Bina Karki" } }),
    ),
  );
}

describe("admin setting detail", () => {
  beforeEach(() => setAccessToken("access-1"));
  afterEach(() => setAccessToken(null));

  it("shows what the setting does, its range and who changed it", async () => {
    serve(14);
    renderAdmin(<SettingScreen settingKey={KEY} />);
    expect(await screen.findByRole("heading", { name: KEY })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("href")).toBe(
      "/admin/settings",
    );
    expect(screen.getByText(/Days a student may still change/)).toBeTruthy();
    expect(screen.getByLabelText("Value")).toHaveProperty("value", "14");
    expect(screen.getByText("Whole number from 0 to 60")).toBeTruthy();
    expect(screen.getByText("Platform")).toBeTruthy();
    expect(await screen.findByText("Bina Karki")).toBeTruthy();
    expect(screen.getByText("System")).toBeTruthy();
    expect(screen.getByText(/what this setting changes/)).toBeTruthy();
  });

  it("saves a new value", async () => {
    let body: unknown = null;
    serve(14);
    server.use(
      http.put(`${API}/api/v1/admin/settings/${KEY}`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, data: setting(20) });
      }),
    );
    renderAdmin(<SettingScreen settingKey={KEY} />);
    const value = await screen.findByLabelText("Value");
    fireEvent.change(value, { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(body).toEqual({ value: 20 }));
    expect(await screen.findByRole("status")).toBeTruthy();
  });

  it("resets the setting to its default", async () => {
    let body: unknown = null;
    serve(7);
    server.use(
      http.put(`${API}/api/v1/admin/settings/${KEY}`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, data: setting(14) });
      }),
    );
    renderAdmin(<SettingScreen settingKey={KEY} />);
    fireEvent.click(await screen.findByRole("button", { name: "Reset to default" }));
    await waitFor(() => expect(body).toEqual({ value: 14 }));
  });

  it("keeps the typed value when it is outside the range", async () => {
    serve(14);
    renderAdmin(<SettingScreen settingKey={KEY} />);
    const value = await screen.findByLabelText("Value");
    fireEvent.change(value, { target: { value: "99" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("That number is outside the allowed range.")).toBeTruthy();
    expect(screen.getByLabelText("Value")).toHaveProperty("value", "99");
  });

  it("keeps the typed value when saving fails offline", async () => {
    serve(14);
    server.use(http.put(`${API}/api/v1/admin/settings/${KEY}`, () => HttpResponse.error()));
    renderAdmin(<SettingScreen settingKey={KEY} />);
    const value = await screen.findByLabelText("Value");
    fireEvent.change(value, { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("button", { name: "No connection" })).toBeTruthy();
    expect(screen.getByLabelText("Value")).toHaveProperty("value", "20");
  });

  it("says not found for a key the list does not have", async () => {
    server.use(
      http.get(`${API}/api/v1/admin/settings`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );
    renderAdmin(<SettingScreen settingKey="missing.key" />);
    expect(await screen.findByRole("heading", { name: "Nothing here yet" })).toBeTruthy();
  });
});
