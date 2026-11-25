import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { AccountStatesScreen } from "./AccountStatesScreen";
import { renderAdmin } from "./admin-test-utils";
import { RoleScreen } from "./RoleScreen";
import { RolesScreen } from "./RolesScreen";

const ROLE = "01J9Z8Y7X6W5V4T3S2R1Q0P9N3";
const ORG_ROLE = "01J9Z8Y7X6W5V4T3S2R1Q0P9N2";

function ok(data: unknown) {
  return HttpResponse.json({ success: true, data });
}

function role(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    name: "Platform admin",
    account_kind: "staff",
    scope_kind: "platform",
    is_system: true,
    description: "Runs the platform",
    permissions: ["content.draft.read"],
    ...extra,
  };
}

const catalog = [
  { name: "content.draft.read", description: "Read drafts" },
  { name: "content.draft.write", description: "Write drafts" },
];

const bothRoles = [
  role(ROLE),
  role(ORG_ROLE, {
    name: "School teacher",
    account_kind: "member",
    scope_kind: "organisation",
    is_system: false,
    description: "Teaches one school",
    permissions: [],
  }),
];

function mockRoles(roles: unknown[] = bothRoles) {
  server.use(
    http.get(`${API}/api/v1/rbac/roles`, () => ok(roles)),
    http.get(`${API}/api/v1/rbac/permissions`, () => ok(catalog)),
  );
}

describe("admin roles", () => {
  it("splits roles by scope and leaves the people count unmarked", async () => {
    mockRoles();
    renderAdmin(<RolesScreen />);
    const platform = await screen.findByRole("link", { name: "Platform admin" });
    expect(platform.getAttribute("href")).toBe(`/admin/roles/${ROLE}`);
    expect(platform.className).not.toContain("underline");
    expect(screen.getByRole("link", { name: "School teacher" }).getAttribute("href")).toBe(
      `/admin/roles/${ORG_ROLE}`,
    );
    expect(screen.getByText("Built in")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Edit" })).toBeTruthy();
    expect(screen.getByText(/Nothing returns how many accounts/)).toBeTruthy();
    expect(screen.getAllByText("API to be added")).toHaveLength(2);
  });

  it("says when there are no roles", async () => {
    mockRoles([]);
    renderAdmin(<RolesScreen />);
    expect(await screen.findByText("Platform roles will show up here.")).toBeTruthy();
    expect(screen.getByText("Organisation roles will show up here.")).toBeTruthy();
  });

  it("says there is no connection when roles cannot load", async () => {
    server.use(http.get(`${API}/api/v1/rbac/roles`, () => HttpResponse.error()));
    renderAdmin(<RolesScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("says you cannot do this when roles are forbidden", async () => {
    server.use(
      http.get(`${API}/api/v1/rbac/roles`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<RolesScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });

  it("asks for a name, then keeps it when creating a role has no connection", async () => {
    mockRoles([]);
    let body: unknown;
    server.use(
      http.post(`${API}/api/v1/rbac/roles`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.error();
      }),
    );
    renderAdmin(<RolesScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "New role" }));
    fireEvent.click(screen.getByRole("button", { name: "Create role" }));
    expect(await screen.findByText("Enter a name.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Helper" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Helps a school" } });
    fireEvent.click(screen.getByRole("button", { name: "Create role" }));
    await waitFor(() =>
      expect(body).toEqual({
        name: "Helper",
        account_kind: "member",
        scope_kind: "platform",
        description: "Helps a school",
        permissions: [],
      }),
    );
    expect(screen.getByLabelText("Name")).toHaveProperty("value", "Helper");
    expect(screen.getByRole("button", { name: "No connection" })).toBeTruthy();
  });
});

describe("admin role", () => {
  it("saves the permission set from the catalogue and can discard", async () => {
    mockRoles([role(ROLE, { is_system: false })]);
    let body: unknown;
    server.use(
      http.patch(`${API}/api/v1/rbac/roles/${ROLE}`, async ({ request }) => {
        body = await request.json();
        return ok(
          role(ROLE, {
            is_system: false,
            permissions: ["content.draft.read", "content.draft.write"],
          }),
        );
      }),
    );
    renderAdmin(<RoleScreen roleId={ROLE} />);
    const write = await screen.findByRole("checkbox", { name: /content\.draft\.write/ });
    expect(screen.getByRole("group", { name: "content" })).toBeTruthy();
    fireEvent.click(write);
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(write).toHaveProperty("checked", false);
    fireEvent.click(write);
    fireEvent.click(screen.getByRole("button", { name: "Save permissions" }));
    await waitFor(() =>
      expect(body).toMatchObject({
        description: "Runs the platform",
        permissions: ["content.draft.read", "content.draft.write"],
      }),
    );
    expect(await screen.findByText("Permissions saved.")).toBeTruthy();
  });

  it("filters permissions by the catalogue text", async () => {
    mockRoles([role(ROLE, { is_system: false })]);
    renderAdmin(<RoleScreen roleId={ROLE} />);
    fireEvent.change(await screen.findByLabelText("Filter permissions"), {
      target: { value: "write" },
    });
    expect(screen.queryByRole("checkbox", { name: /content\.draft\.read/ })).toBeNull();
    expect(screen.getByRole("checkbox", { name: /content\.draft\.write/ })).toBeTruthy();
  });

  it("does not let a built-in role be changed or deleted", async () => {
    mockRoles([role(ROLE)]);
    renderAdmin(<RoleScreen roleId={ROLE} />);
    const box = await screen.findByRole("checkbox", { name: /content\.draft\.read/ });
    expect(box).toHaveProperty("disabled", true);
    expect(screen.queryByRole("button", { name: "Save permissions" })).toBeNull();
    expect(screen.getByRole("button", { name: "Delete role" })).toHaveProperty("disabled", true);
    expect(screen.getByText(/holders of a role are not listed/)).toBeTruthy();
  });

  it("deletes a custom role", async () => {
    mockRoles([role(ROLE, { is_system: false })]);
    let deleted = false;
    server.use(
      http.delete(`${API}/api/v1/rbac/roles/${ROLE}`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderAdmin(<RoleScreen roleId={ROLE} />);
    fireEvent.click(await screen.findByRole("button", { name: "Delete role" }));
    expect(await screen.findByText("Role deleted.")).toBeTruthy();
    expect(deleted).toBe(true);
  });

  it("says when the role is not in the list", async () => {
    mockRoles([role(ROLE)]);
    renderAdmin(<RoleScreen roleId={ORG_ROLE} />);
    expect(await screen.findByRole("heading", { name: "Nothing here yet" })).toBeTruthy();
  });

  it("says there is no connection when the role cannot load", async () => {
    mockRoles();
    server.use(http.get(`${API}/api/v1/rbac/roles`, () => HttpResponse.error()));
    renderAdmin(<RoleScreen roleId={ROLE} />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });
});

describe("admin account states", () => {
  it("shows what a pause and a closure mean", () => {
    renderAdmin(<AccountStatesScreen />);
    expect(screen.getByRole("heading", { name: "When an account is not active" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Someone stopped this account signing in" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Let this account sign in again" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Stop the closure" })).toBeTruthy();
  });
});
