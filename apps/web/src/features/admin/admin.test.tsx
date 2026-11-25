import { fireEvent, render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setAccessToken } from "@/lib/session";
import { API, server } from "@/test/server";

import { AdminApp } from "./AdminApp";
import { AdminHomeScreen } from "./AdminHomeScreen";
import { AdminPage } from "./AdminPage";
import { DeliveriesScreen } from "./DeliveriesScreen";
import { SettingsScreen } from "./SettingsScreen";
import { SitePageScreen } from "./SitePageScreen";
import { WebhooksScreen } from "./WebhooksScreen";

import { LEAD_ID, page, renderAdmin } from "./admin-test-utils";

describe("admin session", () => {
  it("shows sign-in when the session check has no connection", async () => {
    server.use(http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.error()));
    render(<AdminApp>Overview</AdminApp>);
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "No connection" })).toBeNull();
  });

  it("keeps the sidebar fixed and puts sign out in the account menu", async () => {
    server.use(
      http.post(`${API}/api/v1/auth/refresh`, () =>
        HttpResponse.json({
          success: true,
          data: {
            access_token: "access-1",
            token_type: "bearer",
            expires_in: 900,
            session_id: LEAD_ID,
          },
        }),
      ),
      http.get(`${API}/api/v1/me`, () =>
        HttpResponse.json({
          success: true,
          data: {
            user: {
              id: LEAD_ID,
              account_kind: "staff",
              status: "active",
              name: "Bina Karki",
              date_of_birth: null,
              dob_source: null,
              source: "staff",
              locale: "en",
              mfa_required: false,
              under_13: null,
              identifiers: [],
            },
          },
        }),
      ),
      http.get(`${API}/api/v1/admin/school-leads`, () => page([])),
      http.get(`${API}/api/v1/notifications/admin/deliveries`, () => page([])),
      http.get(`${API}/api/v1/enrollment/change-requests`, () =>
        HttpResponse.json({
          success: true,
          data: [],
          meta: { pagination: { limit: 1, offset: 0, total: 9 } },
        }),
      ),
      http.get(`${API}/api/v1/rbac/users/${LEAD_ID}`, () =>
        HttpResponse.json({
          success: true,
          data: {
            user_id: LEAD_ID,
            account_kind: "staff",
            status: "active",
            roles: [
              {
                id: LEAD_ID,
                role: "super_admin",
                scope_id: null,
                granted_by: null,
                created_at: "2026-01-01T00:00:00Z",
              },
            ],
            direct_permissions: [],
            effective_platform: [],
            effective_by_organisation: {},
          },
        }),
      ),
      http.post(`${API}/api/v1/auth/sign-out`, () => HttpResponse.json({ success: true })),
    );
    render(
      <AdminApp>
        <AdminPage title="Overview">body</AdminPage>
      </AdminApp>,
    );
    const nav = await screen.findByRole("navigation", { name: "Admin sections" });
    expect(nav.className).toContain("fixed");
    expect(nav.className).toContain("md:flex");
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Change requests" })).toBeTruthy();
    expect(await screen.findByText("9")).toBeTruthy();
    expect(await screen.findByText("Super admin")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Collapse menu" }));
    expect(screen.getByRole("button", { name: "Expand menu" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Overview" }).getAttribute("title")).toBe("Overview");
    fireEvent.click(screen.getByRole("button", { name: "Expand menu" }));
    expect(await screen.findByRole("button", { name: /Bina Karki/ })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "Sign out" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Account options/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Sign out" }));
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeTruthy();
  });
});

describe("admin overview", () => {
  beforeEach(() => setAccessToken("access-1"));
  afterEach(() => setAccessToken(null));

  it("keeps the overview labels while the lists are still loading", () => {
    server.use(
      http.get(`${API}/api/v1/admin/school-leads`, () => new Promise(() => undefined)),
      http.get(`${API}/api/v1/organisations`, () => new Promise(() => undefined)),
      http.get(`${API}/api/v1/notifications/admin/deliveries`, () => new Promise(() => undefined)),
    );
    renderAdmin(<AdminHomeScreen />);
    expect(screen.queryByRole("heading", { name: "Loading" })).toBeNull();
    expect(screen.getByText("Schools")).toBeTruthy();
    expect(screen.getByText("Open leads")).toBeTruthy();
    expect(screen.getByRole("status", { name: "Loading" })).toBeTruthy();
  });

  it("keeps an empty call list in the same inset as a lead row", async () => {
    server.use(
      http.get(`${API}/api/v1/admin/school-leads`, () => page([])),
      http.get(`${API}/api/v1/organisations`, () => page([])),
      http.get(`${API}/api/v1/notifications/admin/deliveries`, () => page([])),
    );
    renderAdmin(<AdminHomeScreen />);
    const note = await screen.findByText("New school enquiries will show up here.");
    expect(note.className).toContain("px-4");
    expect(note.className).toContain("py-3");
    expect(screen.getByRole("heading", { name: "Leads to call" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "No school leads" })).toBeNull();
  });

  it("shows a live lead and the loaded school count", async () => {
    server.use(
      http.get(`${API}/api/v1/admin/school-leads`, () =>
        page([
          {
            id: LEAD_ID,
            contact_name: "Sita",
            school_name: "Shree School",
            phone: "+9779800000000",
            status: "new",
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: "2026-01-01T00:00:00Z",
          },
        ]),
      ),
      http.get(`${API}/api/v1/organisations`, () =>
        page([
          {
            id: LEAD_ID,
            name: "Shree School",
            kind: "school",
            status: "active",
            vat_registered: false,
            created_at: "2026-01-01T00:00:00Z",
          },
        ]),
      ),
      http.get(`${API}/api/v1/notifications/admin/deliveries`, () => page([])),
    );
    renderAdmin(<AdminHomeScreen />);
    expect(await screen.findByRole("link", { name: "Shree School" })).toBeTruthy();
    expect(screen.getByText("1 active · 0 suspended")).toBeTruthy();
    expect(screen.getByText("1 new · 0 contacted")).toBeTruthy();
    expect(screen.getByText("2 days")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /deliveries failed|delivery failed/ })).toBeNull();
    expect(screen.getByText("Seats held")).toBeTruthy();
    expect(screen.getAllByText("API to be added").length).toBeGreaterThanOrEqual(3);
  });

  it("points at the delivery log when a delivery has failed", async () => {
    server.use(
      http.get(`${API}/api/v1/admin/school-leads`, () => page([])),
      http.get(`${API}/api/v1/organisations`, () => page([])),
      http.get(`${API}/api/v1/notifications/admin/deliveries`, () =>
        page([
          {
            id: LEAD_ID,
            kind: "sms",
            channel: "sms",
            priority: "normal",
            status: "failed",
            attempts: 4,
            address: null,
            recipient_id: null,
            endpoint_id: null,
            last_error: null,
            next_attempt_at: null,
            created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            updated_at: "2026-01-01T00:00:00Z",
          },
        ]),
      ),
    );
    renderAdmin(<AdminHomeScreen />);
    const notice = await screen.findByRole("link", { name: /1 delivery failed/ });
    expect(notice.getAttribute("href")).toBe("/admin/deliveries");
    expect(screen.getByText("SMS, up to 4 tries each")).toBeTruthy();
  });
});

describe("admin settings, webhooks, deliveries and site pages", () => {
  beforeEach(() => setAccessToken("access-1"));
  afterEach(() => setAccessToken(null));

  it("shows a platform setting", async () => {
    server.use(
      http.get(`${API}/api/v1/admin/settings`, () =>
        page([
          {
            key: "max_devices",
            description: "How many devices one student may use",
            value: 2,
            default: 2,
            minimum: 1,
            maximum: 5,
            scope: "platform",
            is_default: true,
          },
        ]),
      ),
    );
    renderAdmin(<SettingsScreen />);
    expect(await screen.findByRole("link", { name: "max_devices" })).toBeTruthy();
  });

  it("shows a new webhook secret once", async () => {
    server.use(
      http.get(`${API}/api/v1/notifications/admin/webhooks`, () => page([])),
      http.post(`${API}/api/v1/notifications/admin/webhooks`, () =>
        HttpResponse.json({
          success: true,
          data: {
            id: LEAD_ID,
            name: "Slack",
            url: "https://example.test/hook",
            format: "generic",
            events: ["user.created"],
            active: true,
            created_at: "2026-01-01T00:00:00Z",
            signing_secret: "secret-once",
          },
        }),
      ),
    );
    renderAdmin(<WebhooksScreen />);
    expect(await screen.findByRole("heading", { name: "No webhooks" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Slack" } });
    fireEvent.change(screen.getByLabelText("URL"), {
      target: { value: "https://example.test/hook" },
    });
    fireEvent.change(screen.getByLabelText("Events"), { target: { value: "user.created" } });
    const form = screen.getByRole("heading", { name: "Add webhook" }).closest("section");
    if (!form) throw new Error("Add webhook form is missing");
    fireEvent.click(within(form).getByRole("button", { name: "Add webhook" }));
    expect(await screen.findByText("secret-once")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "I have stored the secret" }));
    expect(screen.queryByText("secret-once")).toBeNull();
  });

  it("shows no deliveries", async () => {
    server.use(http.get(`${API}/api/v1/notifications/admin/deliveries`, () => page([])));
    renderAdmin(<DeliveriesScreen />);
    expect(await screen.findByRole("heading", { name: "No deliveries" })).toBeTruthy();
  });

  it("publishes a site page", async () => {
    server.use(
      http.get(`${API}/api/v1/site-pages/:slug`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "no" } }, { status: 404 }),
      ),
      http.post(`${API}/api/v1/admin/site-pages`, () =>
        HttpResponse.json({
          success: true,
          data: {
            id: LEAD_ID,
            slug: "terms",
            locale: "en",
            version: "2026-01",
            title: "Terms of use",
            body: "The terms.",
            published_at: "2026-01-02T04:15:00Z",
          },
        }),
      ),
    );
    renderAdmin(<SitePageScreen />);
    expect(await screen.findByText("No published version yet.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Version"), { target: { value: "2026-01" } });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Terms of use" } });
    fireEvent.change(screen.getByLabelText("Body — Markdown"), { target: { value: "The terms." } });
    fireEvent.click(
      within(screen.getByRole("form", { name: "Publish" })).getByRole("button", {
        name: "Publish",
      }),
    );
    expect(await screen.findByText(/Published Terms of use/)).toBeTruthy();
  });
});
