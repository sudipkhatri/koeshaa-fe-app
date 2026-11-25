import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setAccessToken } from "@/lib/session";
import { API, server } from "@/test/server";

import { LEAD_ID, page, renderAdmin } from "./admin-test-utils";
import { SchoolLeadScreen } from "./SchoolLeadScreen";

const STAFF_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9S1";
const SCHOOL_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9O1";
const LEAD_URL = `${API}/api/v1/admin/school-leads/${LEAD_ID}`;

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: LEAD_ID,
    contact_name: "Bina Rai",
    school_name: "Himalaya Academy",
    phone: "+9779800000044",
    message: "We have 240 students in Classes 6 to 10.",
    status: "new",
    assigned_to: null,
    assigned_name: null,
    organisation_id: null,
    created_at: "2026-10-19T04:27:00Z",
    updated_at: "2026-10-19T04:27:00Z",
    ...overrides,
  };
}

function one<T>(data: T) {
  return HttpResponse.json({ success: true, data });
}

function serveLead(current: Record<string, unknown>) {
  server.use(
    http.get(LEAD_URL, () => one(current)),
    http.get(`${API}/api/v1/users`, () => page([{ id: STAFF_ID, name: "Bina Karki" }])),
  );
}

describe("admin school lead detail", () => {
  beforeEach(() => setAccessToken("access-1"));
  afterEach(() => setAccessToken(null));

  it("shows the enquiry, the next step and the history", async () => {
    serveLead(lead());
    renderAdmin(<SchoolLeadScreen leadId={LEAD_ID} />);
    expect(await screen.findByRole("heading", { name: "Himalaya Academy" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "School leads" }).getAttribute("href")).toBe(
      "/admin/school-leads",
    );
    expect(screen.getByRole("link", { name: "+977 9800000044" }).getAttribute("href")).toBe(
      "tel:+9779800000044",
    );
    expect(screen.getByText(/240 students/)).toBeTruthy();
    const current = screen
      .getAllByRole("listitem")
      .find((item) => item.getAttribute("aria-current") === "step");
    expect(current?.textContent).toContain("Call and agree the seats");
    expect(current?.textContent).toContain("Waiting on us");
    expect(screen.getByText("Nothing else yet.")).toBeTruthy();
    expect(screen.getByText("API to be added")).toBeTruthy();
  });

  it("marks a new lead contacted and keeps the other fields", async () => {
    let body: unknown = null;
    let current = lead({ assigned_to: STAFF_ID });
    serveLead(current);
    server.use(
      http.get(LEAD_URL, () => one(current)),
      http.patch(LEAD_URL, async ({ request }) => {
        body = await request.json();
        current = lead({
          assigned_to: STAFF_ID,
          status: "contacted",
          updated_at: "2026-10-20T04:27:00Z",
        });
        return one(current);
      }),
    );
    renderAdmin(<SchoolLeadScreen leadId={LEAD_ID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Mark contacted" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Mark contacted" })).toBeNull(),
    );
    expect(body).toEqual({ status: "contacted", assigned_to: STAFF_ID, organisation_id: null });
    expect(screen.getByText("Contacted, seats not agreed yet")).toBeTruthy();
    expect(screen.getByLabelText("Status").textContent).toBe("Contacted");
  });

  it("creates the school once even when linking it has to be retried", async () => {
    const created: unknown[] = [];
    const links: unknown[] = [];
    serveLead(lead());
    server.use(
      http.post(`${API}/api/v1/organisations`, async ({ request }) => {
        created.push(await request.json());
        return one({
          id: SCHOOL_ID,
          name: "Himalaya Academy",
          kind: "school",
          status: "active",
          created_at: "2026-10-20T04:27:00Z",
        });
      }),
      http.patch(LEAD_URL, async ({ request }) => {
        links.push(await request.json());
        if (links.length === 1) {
          return HttpResponse.json({ error: { code: "HTTP_500", message: "no" } }, { status: 500 });
        }
        return one(lead({ status: "won", organisation_id: SCHOOL_ID }));
      }),
    );
    renderAdmin(<SchoolLeadScreen leadId={LEAD_ID} />);
    fireEvent.click(await screen.findByRole("button", { name: "Create the school" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Create the school" }));
    const open = await screen.findByRole("link", { name: "Open the school" });
    expect(open.getAttribute("href")).toBe(`/admin/organisations/${SCHOOL_ID}`);
    expect(created).toEqual([
      {
        name: "Himalaya Academy",
        kind: "school",
        contact_phone: "+9779800000044",
        vat_registered: false,
      },
    ]);
    expect(links[1]).toEqual({ status: "won", assigned_to: null, organisation_id: SCHOOL_ID });
    expect(screen.getByText("The school is created and linked to this lead.")).toBeTruthy();
  });

  it("assigns a staff member by name", async () => {
    let body: unknown = null;
    serveLead(lead());
    server.use(
      http.patch(LEAD_URL, async ({ request }) => {
        body = await request.json();
        return one(lead({ assigned_to: STAFF_ID, updated_at: "2026-10-20T04:27:00Z" }));
      }),
    );
    renderAdmin(<SchoolLeadScreen leadId={LEAD_ID} />);
    const assigned = await screen.findByLabelText("Assigned to");
    fireEvent.click(assigned);
    fireEvent.click(
      await within(screen.getByRole("listbox")).findByRole("option", { name: "Bina Karki" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(body).toEqual({ status: "new", assigned_to: STAFF_ID, organisation_id: null });
  });

  it("names the assignee when the staff list cannot be loaded", async () => {
    server.use(
      http.get(LEAD_URL, () => one(lead({ assigned_to: STAFF_ID, assigned_name: "Bina Karki" }))),
      http.get(`${API}/api/v1/users`, () =>
        HttpResponse.json({ error: { code: "HTTP_500", message: "no" } }, { status: 500 }),
      ),
    );
    renderAdmin(<SchoolLeadScreen leadId={LEAD_ID} />);
    expect(await screen.findByText(/Could not load staff names/)).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByLabelText("Assigned to").textContent).toBe("Bina Karki"),
    );
  });

  it("keeps the assignment when saving fails offline", async () => {
    serveLead(lead());
    server.use(http.patch(LEAD_URL, () => HttpResponse.error()));
    renderAdmin(<SchoolLeadScreen leadId={LEAD_ID} />);
    fireEvent.click(await screen.findByLabelText("Assigned to"));
    fireEvent.click(
      await within(screen.getByRole("listbox")).findByRole("option", { name: "Bina Karki" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("button", { name: "No connection" })).toBeTruthy();
    expect(screen.getByLabelText("Assigned to").textContent).toBe("Bina Karki");
  });

  it("says not found when the lead does not exist", async () => {
    server.use(
      http.get(LEAD_URL, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "no" } }, { status: 404 }),
      ),
    );
    renderAdmin(<SchoolLeadScreen leadId={LEAD_ID} />);
    expect(await screen.findByRole("heading", { name: "Nothing here yet" })).toBeTruthy();
  });

  it("does not request an id the API would reject", async () => {
    renderAdmin(<SchoolLeadScreen leadId="not-an-id" />);
    expect(await screen.findByRole("heading", { name: "Nothing here yet" })).toBeTruthy();
  });
});
