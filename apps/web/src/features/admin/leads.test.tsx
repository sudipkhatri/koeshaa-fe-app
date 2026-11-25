import { fireEvent, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setAccessToken } from "@/lib/session";
import { API, server } from "@/test/server";

import { LEAD_ID, page, renderAdmin } from "./admin-test-utils";
import { SchoolLeadsScreen } from "./SchoolLeadsScreen";

describe("admin school leads", () => {
  beforeEach(() => setAccessToken("access-1"));
  afterEach(() => setAccessToken(null));

  it("shows an empty list", async () => {
    server.use(http.get(`${API}/api/v1/admin/school-leads`, () => page([])));
    renderAdmin(<SchoolLeadsScreen />);
    expect(await screen.findByRole("heading", { name: "No school leads" })).toBeTruthy();
    const status = screen.getByLabelText("Status");
    expect(status.closest(".sm\\:w-50")).toBeTruthy();
    expect(screen.getByText(/search, assignee names and sorting/)).toBeTruthy();
    expect(status.className).toContain("pr-3");
    fireEvent.click(status);
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByRole("option", { name: "New" })).toBeTruthy();
  });

  it("shows a school from the list", async () => {
    server.use(
      http.get(`${API}/api/v1/admin/school-leads`, () =>
        page([
          {
            id: LEAD_ID,
            contact_name: "Sita",
            school_name: "Shree School",
            phone: "+9779800000000",
            status: "contacted",
            assigned_to: "01J9Z8Y7X6W5V4T3S2R1Q0P9U1",
            assigned_name: "Sudip Khatri",
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        ]),
      ),
    );
    renderAdmin(<SchoolLeadsScreen />);
    expect(await screen.findByRole("link", { name: "Shree School" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Contact" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Phone" })).toBeTruthy();
    expect(screen.getByText("Sita")).toBeTruthy();
    expect(screen.getByText("+977 9800000000")).toBeTruthy();
    expect(screen.getByText("Sudip Khatri")).toBeTruthy();
    expect(screen.queryByText("01J9Z8Y7X6W5V4T3S2R1Q0P9U1")).toBeNull();
    expect(screen.getByText(/^1 Jan/)).toBeTruthy();
  });

  it("pages through leads with next and previous", async () => {
    const lead = (id: string, school: string) => ({
      id,
      contact_name: "Sita",
      school_name: school,
      phone: "+9779800000000",
      status: "new",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    server.use(
      http.get(`${API}/api/v1/admin/school-leads`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        if (cursor === "page-2") return page([lead("01J9Z8Y7X6W5V4T3S2R1Q0P9N9", "Second School")]);
        return page([lead(LEAD_ID, "First School")], "page-2");
      }),
    );
    renderAdmin(<SchoolLeadsScreen />);
    expect(await screen.findByRole("link", { name: "First School" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Previous/ })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(await screen.findByRole("link", { name: "Second School" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Previous/ }));
    expect(await screen.findByRole("link", { name: "First School" })).toBeTruthy();
    expect(screen.queryByText(/Sita ·/)).toBeNull();
  });

  it("shows the server error state", async () => {
    server.use(
      http.get(`${API}/api/v1/admin/school-leads`, () =>
        HttpResponse.json({ error: { code: "HTTP_500", message: "no" } }, { status: 500 }),
      ),
    );
    renderAdmin(<SchoolLeadsScreen />);
    expect(await screen.findByRole("heading", { name: "Oops, that was on us" })).toBeTruthy();
  });

  it("shows no connection when the list cannot be reached", async () => {
    server.use(http.get(`${API}/api/v1/admin/school-leads`, () => HttpResponse.error()));
    renderAdmin(<SchoolLeadsScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });
});
