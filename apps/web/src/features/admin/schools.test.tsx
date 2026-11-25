import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setAccessToken } from "@/lib/session";
import { API, server } from "@/test/server";

import { page, renderAdmin } from "./admin-test-utils";
import { OrganisationsScreen } from "./OrganisationsScreen";

const ORG_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9N8";
const OTHER_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9N9";
const LIST = `${API}/api/v1/organisations`;

function organisation(id: string, name: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name,
    kind: "school",
    status: "active",
    vat_registered: false,
    address: { district: "Lalitpur" },
    created_at: "2026-10-14T04:00:00Z",
    ...overrides,
  };
}

function mySchools(data: unknown[]) {
  return http.get(`${API}/api/v1/me/schools`, () => HttpResponse.json({ success: true, data }));
}

describe("admin schools list", () => {
  beforeEach(() => {
    setAccessToken("access-1");
    server.use(mySchools([]));
  });
  afterEach(() => setAccessToken(null));

  it("shows an empty school list", async () => {
    server.use(http.get(LIST, () => page([])));
    renderAdmin(<OrganisationsScreen />);
    expect(await screen.findByRole("heading", { name: "No schools" })).toBeTruthy();
    expect(screen.getByText(/sorting and seat counts/)).toBeTruthy();
  });

  it("shows the schools you handle as cards, with seats marked as not backed", async () => {
    server.use(
      mySchools([
        {
          organisation_id: ORG_ID,
          name: "Everest School",
          kind: "school",
          status: "active",
          role: "school_admin",
          joined_at: "2026-10-14T04:00:00Z",
        },
      ]),
      http.get(LIST, () => page([])),
    );
    renderAdmin(<OrganisationsScreen />);
    const card = await screen.findByRole("link", { name: /Everest School/ });
    expect(card.getAttribute("href")).toBe(`/admin/organisations/${ORG_ID}`);
    expect(within(card).getByText("Seats held")).toBeTruthy();
    expect(within(card).getByText("API to be added")).toBeTruthy();
  });

  it("hides your schools when the account may not list them", async () => {
    server.use(
      http.get(`${API}/api/v1/me/schools`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
      http.get(LIST, () => page([])),
    );
    renderAdmin(<OrganisationsScreen />);
    await screen.findByRole("heading", { name: "No schools" });
    expect(screen.queryByRole("heading", { name: "Your schools" })).toBeNull();
  });

  it("lists organisations with district, status and created date", async () => {
    server.use(
      http.get(LIST, () =>
        page([
          organisation(ORG_ID, "Everest School"),
          organisation(OTHER_ID, "Gyan Jyoti Academy", { status: "suspended" }),
        ]),
      ),
    );
    renderAdmin(<OrganisationsScreen />);
    const row = (await screen.findByRole("link", { name: "Everest School" })).closest("tr");
    expect(row && within(row).getByText("Lalitpur")).toBeTruthy();
    expect(row && within(row).getByText("Active")).toBeTruthy();
    expect(row && within(row).getByText(/^14 Oct/)).toBeTruthy();
    expect(screen.getByText("Suspended")).toBeTruthy();
  });

  it("searches by name and kind, and pages with next and previous", async () => {
    const asked: URLSearchParams[] = [];
    server.use(
      http.get(LIST, ({ request }) => {
        const params = new URL(request.url).searchParams;
        asked.push(params);
        if (params.get("cursor") === "page-2") {
          return page([organisation(OTHER_ID, "Second School")]);
        }
        return page([organisation(ORG_ID, "First School")], "page-2");
      }),
    );
    renderAdmin(<OrganisationsScreen />);
    await screen.findByRole("link", { name: "First School" });
    expect(asked[0]?.get("kind")).toBe("school");
    fireEvent.change(screen.getByLabelText("Search by name"), { target: { value: " Everest " } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(asked.at(-1)?.get("q")).toBe("Everest"));
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(await screen.findByRole("link", { name: "Second School" })).toBeTruthy();
    expect(asked.at(-1)?.get("q")).toBe("Everest");
    fireEvent.click(screen.getByRole("button", { name: /Previous/ }));
    expect(await screen.findByRole("link", { name: "First School" })).toBeTruthy();
  });

  it("opens the create panel from the header and sends a blank PAN as null", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      http.get(LIST, () => page([])),
      http.post(LIST, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { success: true, data: organisation(ORG_ID, "Shree School") },
          { status: 201 },
        );
      }),
    );
    renderAdmin(<OrganisationsScreen />);
    const open = await screen.findByRole("button", { name: "Create a school" });
    expect(open.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(open);
    const panel = screen.getByRole("region", { name: "Create a school" });
    fireEvent.change(within(panel).getByLabelText("Name"), { target: { value: "Shree School" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Create a school" }));
    const done = (await screen.findByText(/Shree School is created\./)).closest("p");
    if (!done) throw new Error("no confirmation");
    expect(within(done).getByRole("link").getAttribute("href")).toBe(
      `/admin/organisations/${ORG_ID}`,
    );
    expect(body).toMatchObject({ kind: "school", pan_number: null, vat_registered: false });
    expect(screen.queryByRole("region", { name: "Create a school" })).toBeNull();
  });

  it("shows a field error and keeps the input when the PAN is wrong", async () => {
    server.use(http.get(LIST, () => page([])));
    renderAdmin(<OrganisationsScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Create a school" }));
    const panel = screen.getByRole("region", { name: "Create a school" });
    fireEvent.change(within(panel).getByLabelText("Name"), { target: { value: "Shree School" } });
    fireEvent.change(within(panel).getByLabelText("PAN"), { target: { value: "12" } });
    fireEvent.click(within(panel).getByRole("button", { name: "Create a school" }));
    await waitFor(() =>
      expect(within(panel).getByLabelText("PAN").getAttribute("aria-invalid")).toBe("true"),
    );
    expect(within(panel).getByLabelText("Name")).toHaveProperty("value", "Shree School");
  });
});
