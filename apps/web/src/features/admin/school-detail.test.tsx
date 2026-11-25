import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setAccessToken } from "@/lib/session";
import { API, server } from "@/test/server";

import { page, renderAdmin } from "./admin-test-utils";
import { OrganisationScreen } from "./OrganisationScreen";

const ORG_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9N8";
const USER_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9S1";
const ORG = `${API}/api/v1/organisations/${ORG_ID}`;

function organisation(overrides: Record<string, unknown> = {}) {
  return {
    id: ORG_ID,
    name: "Everest School",
    kind: "school",
    status: "active",
    vat_registered: true,
    contact_phone: "+9779800000002",
    pan_number: "301458972",
    address: {
      province: "Bagmati",
      district: "Lalitpur",
      municipality: "Lalitpur Metropolitan City",
      ward: "3",
    },
    created_at: "2026-10-14T04:00:00Z",
    ...overrides,
  };
}

function member() {
  return {
    user_id: USER_ID,
    name: "Hari Adhikari",
    roles: ["school_admin"],
    title: "Principal",
    joined_at: "2026-10-14T04:00:00Z",
  };
}

describe("admin school detail", () => {
  beforeEach(() => setAccessToken("access-1"));
  afterEach(() => setAccessToken(null));

  it("shows the profile, the people and the parts still waiting on an API", async () => {
    server.use(
      http.get(ORG, () => HttpResponse.json({ success: true, data: organisation() })),
      http.get(`${ORG}/members`, () => page([member()])),
    );
    renderAdmin(<OrganisationScreen organisationId={ORG_ID} />);
    expect(await screen.findByRole("heading", { name: "Everest School" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Schools" }).getAttribute("href")).toBe(
      "/admin/organisations",
    );
    expect(screen.getByRole("tab", { name: "Profile", selected: true })).toBeTruthy();
    expect(screen.getByLabelText("Contact phone")).toHaveProperty("value", "+977 9800000002");
    expect(screen.getByLabelText("District")).toHaveProperty("value", "Lalitpur");
    expect(screen.getByRole("checkbox", { name: /VAT registered/ })).toHaveProperty(
      "checked",
      true,
    );
    const row = (await screen.findByText("Hari Adhikari")).closest("tr");
    expect(row && within(row).getByText("School admin")).toBeTruthy();
    expect(row && within(row).getByText("Principal")).toBeTruthy();
    expect(screen.getByText(/never closes their Keoshaa account/)).toBeTruthy();
    expect(screen.getByText(/seats, the price and invoices/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add seats" })).toHaveProperty("disabled", true);
    expect(screen.queryByText("118")).toBeNull();
  });

  it("changes the status", async () => {
    let body: unknown = null;
    let current = organisation();
    server.use(
      http.get(ORG, () => HttpResponse.json({ success: true, data: current })),
      http.get(`${ORG}/members`, () => page([])),
      http.post(`${ORG}/status`, async ({ request }) => {
        body = await request.json();
        current = organisation({ status: "suspended" });
        return HttpResponse.json({ success: true, data: current });
      }),
    );
    renderAdmin(<OrganisationScreen organisationId={ORG_ID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Change status" }));
    const statusForm = screen.getByRole("form", { name: "Change status" });
    fireEvent.click(within(statusForm).getByLabelText("Status"));
    fireEvent.click(await within(statusForm).findByRole("option", { name: "Suspended" }));
    fireEvent.click(within(statusForm).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(body).toEqual({ status: "suspended" }));
    expect(await screen.findByText("Suspended")).toBeTruthy();
  });

  it("finds an account by phone and adds them", async () => {
    let added: unknown = null;
    const people = [member()];
    server.use(
      http.get(ORG, () => HttpResponse.json({ success: true, data: organisation() })),
      http.get(`${ORG}/members`, () => page(people)),
      http.get(`${API}/api/v1/users`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("identifier")).toBe("+9779800000071");
        expect(params.get("identifier_kind")).toBe("phone");
        return page([{ id: USER_ID, name: "Sarita Bhandari" }]);
      }),
      http.post(`${ORG}/members`, async ({ request }) => {
        added = await request.json();
        people.push({
          user_id: "01J9Z8Y7X6W5V4T3S2R1Q0P9S2",
          name: "Sarita Bhandari",
          roles: ["school_staff"],
          title: "Office",
          joined_at: "2026-11-01T04:00:00Z",
        });
        return HttpResponse.json({ success: true, data: people[1] });
      }),
    );
    renderAdmin(<OrganisationScreen organisationId={ORG_ID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Add a person" }));
    fireEvent.change(screen.getByLabelText("Phone, email or username"), {
      target: { value: "+977 9800000071" },
    });
    fireEvent.change(screen.getByLabelText("Job title"), { target: { value: "Office" } });
    fireEvent.click(screen.getByRole("button", { name: "Find and add" }));
    expect(await screen.findByText("Sarita Bhandari")).toBeTruthy();
    expect(added).toEqual({ user_id: USER_ID, role: "school_staff", title: "Office" });
  });

  it("says when nobody signs in that way, and keeps what was typed", async () => {
    server.use(
      http.get(ORG, () => HttpResponse.json({ success: true, data: organisation() })),
      http.get(`${ORG}/members`, () => page([])),
      http.get(`${API}/api/v1/users`, () => page([])),
    );
    renderAdmin(<OrganisationScreen organisationId={ORG_ID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Add a person" }));
    const account = screen.getByLabelText("Phone, email or username");
    fireEvent.change(account, { target: { value: "missing@school.edu.np" } });
    fireEvent.click(screen.getByRole("button", { name: "Find and add" }));
    expect(await screen.findByText("No account uses that sign-in.")).toBeTruthy();
    expect(account).toHaveProperty("value", "missing@school.edu.np");
  });

  it("removes a person without closing their account", async () => {
    let removed = "";
    const people = [member()];
    server.use(
      http.get(ORG, () => HttpResponse.json({ success: true, data: organisation() })),
      http.get(`${ORG}/members`, () => page([...people])),
      http.delete(`${ORG}/members/:userId`, ({ params }) => {
        removed = String(params.userId);
        people.splice(0, people.length);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderAdmin(<OrganisationScreen organisationId={ORG_ID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
    expect(await screen.findByText("People you add will show up here.")).toBeTruthy();
    expect(screen.queryByText("Hari Adhikari")).toBeNull();
    expect(removed).toBe(USER_ID);
  });

  it("keeps the profile when saving fails offline", async () => {
    server.use(
      http.get(ORG, () => HttpResponse.json({ success: true, data: organisation() })),
      http.get(`${ORG}/members`, () => page([])),
      http.patch(ORG, () => HttpResponse.error()),
    );
    renderAdmin(<OrganisationScreen organisationId={ORG_ID} />);
    const name = await screen.findByLabelText("Name");
    fireEvent.change(name, { target: { value: "Everest Secondary" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("button", { name: "No connection" })).toBeTruthy();
    expect(screen.getByLabelText("Name")).toHaveProperty("value", "Everest Secondary");
  });

  it("says not found when the school does not exist", async () => {
    server.use(
      http.get(ORG, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "no" } }, { status: 404 }),
      ),
    );
    renderAdmin(<OrganisationScreen organisationId={ORG_ID} />);
    expect(await screen.findByRole("heading", { name: "Nothing here yet" })).toBeTruthy();
  });
});
