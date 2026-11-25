import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { AccessHomeScreen, AccessScreen } from "./AccessScreen";
import { LEAD_ID, renderAdmin } from "./admin-test-utils";

const ROLE = "01J9Z8Y7X6W5V4T3S2R1Q0P9N3";
const ORG_ROLE = "01J9Z8Y7X6W5V4T3S2R1Q0P9N2";
const ASSIGN = "01J9Z8Y7X6W5V4T3S2R1Q0P9N1";
const GRANT = "01J9Z8Y7X6W5V4T3S2R1Q0P9N0";

function ok(data: unknown) {
  return HttpResponse.json({ success: true, data });
}

function person() {
  return {
    id: LEAD_ID,
    account_kind: "staff",
    status: "active",
    name: "Asha Shrestha",
    date_of_birth: null,
    dob_source: null,
    source: "admin",
    locale: "en",
    mfa_required: false,
    under_13: null,
    identifiers: [],
    created_at: "2026-01-01T00:00:00Z",
    purge_after: null,
  };
}

const roles = [
  {
    id: ROLE,
    name: "Platform admin",
    account_kind: "staff",
    scope_kind: "platform",
    is_system: true,
    description: "Runs the platform",
    permissions: ["content.draft.read"],
  },
  {
    id: ORG_ROLE,
    name: "School teacher",
    account_kind: "member",
    scope_kind: "organisation",
    is_system: false,
    description: "Teaches one school",
    permissions: [],
  },
];

const catalog = [
  { name: "content.draft.read", description: "Read drafts" },
  { name: "content.draft.write", description: "Write drafts" },
];

function access(extra: Record<string, unknown> = {}) {
  return {
    user_id: LEAD_ID,
    account_kind: "staff",
    status: "active",
    roles: [
      {
        id: ASSIGN,
        role: ROLE,
        scope_id: null,
        granted_by: null,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    direct_permissions: [
      {
        id: GRANT,
        permission: "content.draft.write",
        scope_id: null,
        granted_by: null,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    effective_platform: ["content.draft.read"],
    effective_by_organisation: {},
    ...extra,
  };
}

function mockAccess(record: unknown = access()) {
  server.use(
    http.get(`${API}/api/v1/users/:userId`, () => ok(person())),
    http.get(`${API}/api/v1/rbac/users/:userId`, () => ok(record)),
    http.get(`${API}/api/v1/rbac/roles`, () => ok(roles)),
    http.get(`${API}/api/v1/rbac/permissions`, () => ok(catalog)),
  );
}

function choose(label: string, option: string) {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: option }));
}

describe("admin access", () => {
  it("shows roles, a direct permission and what is in force", async () => {
    mockAccess();
    renderAdmin(<AccessScreen userId={LEAD_ID} />);
    expect(await screen.findByRole("heading", { name: "Access" })).toBeTruthy();
    const back = await screen.findByRole("link", { name: "Asha Shrestha" });
    expect(back.getAttribute("href")).toBe(`/admin/accounts/${LEAD_ID}`);
    const role = await screen.findByRole("link", { name: "Platform admin" });
    expect(role.getAttribute("href")).toBe(`/admin/roles/${ROLE}`);
    expect(role.className).not.toContain("underline");
    expect(screen.getByRole("button", { name: "Revoke" })).toBeTruthy();
    const effective = screen.getByRole("region", { name: "What they can actually do" });
    expect(within(effective).getByText("content.draft.read")).toBeTruthy();
    expect(within(effective).getByRole("heading", { name: "Everywhere" })).toBeTruthy();
  });

  it("takes a role away and grants a permission from the catalogue", async () => {
    mockAccess();
    let removed = false;
    let granted: unknown;
    server.use(
      http.delete(`${API}/api/v1/rbac/users/${LEAD_ID}/roles/${ASSIGN}`, () => {
        removed = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(`${API}/api/v1/rbac/users/${LEAD_ID}/permissions`, async ({ request }) => {
        granted = await request.json();
        return ok({
          id: GRANT,
          permission: "content.draft.read",
          scope_id: null,
          granted_by: null,
          created_at: "2026-01-01T00:00:00Z",
        });
      }),
    );
    renderAdmin(<AccessScreen userId={LEAD_ID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Take away" }));
    await waitFor(() => expect(removed).toBe(true));
    fireEvent.click(screen.getByRole("button", { name: "Grant one" }));
    await waitFor(() => expect(granted).toEqual({ permission: "content.draft.read" }));
  });

  it("asks for a school when the role belongs to an organisation", async () => {
    mockAccess();
    let posted = false;
    server.use(
      http.post(`${API}/api/v1/rbac/users/${LEAD_ID}/roles`, () => {
        posted = true;
        return ok({});
      }),
    );
    renderAdmin(<AccessScreen userId={LEAD_ID} />);
    await screen.findByRole("button", { name: "Give a role" });
    choose("Role", "School teacher");
    fireEvent.click(screen.getByRole("button", { name: "Give a role" }));
    expect(await screen.findByText("Enter the school id.")).toBeTruthy();
    expect(posted).toBe(false);
  });

  it("says there is no connection when access cannot load", async () => {
    server.use(
      http.get(`${API}/api/v1/users/:userId`, () => ok(person())),
      http.get(`${API}/api/v1/rbac/users/:userId`, () => HttpResponse.error()),
    );
    renderAdmin(<AccessScreen userId={LEAD_ID} />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("says you cannot do this when access is forbidden", async () => {
    server.use(
      http.get(`${API}/api/v1/users/:userId`, () => ok(person())),
      http.get(`${API}/api/v1/rbac/users/:userId`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<AccessScreen userId={LEAD_ID} />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });

  it("points the access page at an account", () => {
    renderAdmin(<AccessHomeScreen />);
    expect(screen.getByText(/Open the account, then Access/)).toBeTruthy();
  });
});
