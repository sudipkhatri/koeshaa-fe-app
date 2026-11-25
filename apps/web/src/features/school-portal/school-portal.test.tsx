import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LEAD_ID, renderAdmin } from "@/features/admin/admin-test-utils";
import { API, server } from "@/test/server";

import { SchoolShellStub } from "./SchoolApp";
import { SchoolDetailsScreen } from "./SchoolDetailsScreen";
import { SchoolHomeScreen } from "./SchoolHomeScreen";
import { SchoolPeopleScreen } from "./SchoolPeopleScreen";
import { SchoolPickerScreen } from "./SchoolPickerScreen";
import { canDoLabel } from "./school-api";

const ORG = LEAD_ID;
const USER = "01J9Z8Y7X6W5V4T3S2R1Q0P9N7";
const OTHER = "01J9Z8Y7X6W5V4T3S2R1Q0P9N6";
const ADDED = "01J9Z8Y7X6W5V4T3S2R1Q0P9N5";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => `/school/${ORG}`,
  useParams: () => ({ organisationId: ORG }),
}));

function ok(data: unknown) {
  return HttpResponse.json({ success: true, data });
}

function school(id = ORG, name = "Everest School") {
  return {
    organisation_id: id,
    name,
    kind: "school",
    status: "active",
    role: "school_admin",
    title: "Principal",
    joined_at: "2026-01-02T04:15:00Z",
  };
}

function organisation(name = "Everest School") {
  return {
    id: ORG,
    name,
    kind: "school",
    status: "active",
    contact_phone: "+9779800000001",
    pan_number: "301234567",
    vat_registered: true,
    created_at: "2026-01-02T04:15:00Z",
    address: {
      province: "Bagmati",
      district: "Kathmandu",
      municipality: "Lazimpat",
      ward: "2",
    },
  };
}

function mockMeAndSchools(schools = [school()]) {
  server.use(
    http.get(`${API}/api/v1/me`, () =>
      ok({
        user: {
          id: USER,
          account_kind: "member",
          status: "active",
          name: "Hari Adhikari",
          date_of_birth: null,
          dob_source: null,
          source: "self",
          locale: "en",
          mfa_required: false,
          under_13: false,
          identifiers: [],
          created_at: "2026-01-02T04:15:00Z",
          purge_after: null,
        },
        permissions: [],
      }),
    ),
    http.get(`${API}/api/v1/me/schools`, () => ok(schools)),
  );
}

function renderSchool(ui: React.ReactNode) {
  return renderAdmin(<SchoolShellStub>{ui}</SchoolShellStub>);
}

describe("canDoLabel", () => {
  it("maps school_admin to everything and school_staff to read only", () => {
    expect(canDoLabel(["school_admin"])).toBe("everything");
    expect(canDoLabel(["school_staff"])).toBe("readOnly");
    expect(canDoLabel(["custom"])).toBe("mixed");
  });
});

describe("school picker", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it("redirects when there is exactly one school", async () => {
    mockMeAndSchools([school()]);
    renderAdmin(<SchoolPickerScreen />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(`/school/${ORG}`));
  });

  it("lists schools when there are several", async () => {
    mockMeAndSchools([school(ORG, "Everest"), school(OTHER, "Janata")]);
    renderAdmin(<SchoolPickerScreen />);
    expect(await screen.findByRole("heading", { name: "Your schools" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Everest/ }).getAttribute("href")).toBe(
      `/school/${ORG}`,
    );
    expect(screen.getByRole("link", { name: /Janata/ }).getAttribute("href")).toBe(
      `/school/${OTHER}`,
    );
  });

  it("shows empty when there are no schools", async () => {
    mockMeAndSchools([]);
    renderAdmin(<SchoolPickerScreen />);
    expect(await screen.findByRole("heading", { name: "No schools yet" })).toBeTruthy();
  });
});

describe("school overview", () => {
  it("shows the API note and does not invent seat numbers", async () => {
    mockMeAndSchools();
    renderSchool(<SchoolHomeScreen organisationId={ORG} />);
    expect(await screen.findByText(/no students, seats, contracts or progress/i)).toBeTruthy();
    expect(screen.getAllByText("API to be added").length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/\b118\b/);
    expect(document.body.textContent).not.toMatch(/\b120\b/);
  });
});

describe("school people", () => {
  beforeEach(() => {
    mockMeAndSchools();
    server.use(
      http.get(`${API}/api/v1/organisations/:id/members`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              user_id: USER,
              name: "Hari Adhikari",
              roles: ["school_admin"],
              title: "Principal",
              joined_at: "2026-01-02T04:15:00Z",
            },
            {
              user_id: OTHER,
              name: "Sarita Lama",
              roles: ["school_staff"],
              title: "Vice principal",
              joined_at: "2026-01-02T04:15:00Z",
            },
          ],
          meta: { pagination: { limit: 20, next_cursor: null, has_more: false } },
        }),
      ),
    );
  });

  it("lists members and derives Can do from roles", async () => {
    renderSchool(<SchoolPeopleScreen organisationId={ORG} />);
    expect(await screen.findByText("Hari Adhikari")).toBeTruthy();
    expect(screen.getByText("Everything here")).toBeTruthy();
    expect(screen.getByText("Read only")).toBeTruthy();
    expect(screen.getByText(/Can do column/i)).toBeTruthy();
  });

  it("adds a member after looking up the account", async () => {
    let body: unknown;
    server.use(
      http.get(`${API}/api/v1/users`, () =>
        HttpResponse.json({
          success: true,
          data: [{ id: ADDED, name: "Anita" }],
          meta: { pagination: { limit: 2, next_cursor: null, has_more: false } },
        }),
      ),
      http.post(`${API}/api/v1/organisations/:id/members`, async ({ request }) => {
        body = await request.json();
        return ok({
          user_id: ADDED,
          name: "Anita",
          roles: ["school_staff"],
          title: "Coordinator",
          joined_at: "2026-01-03T00:00:00Z",
        });
      }),
    );
    renderSchool(<SchoolPeopleScreen organisationId={ORG} />);
    await screen.findByText("Hari Adhikari");
    fireEvent.click(screen.getByRole("button", { name: "Add someone" }));
    fireEvent.change(screen.getByLabelText("Phone, email or username"), {
      target: { value: "+9779800000071" },
    });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Coordinator" } });
    fireEvent.click(screen.getByRole("button", { name: "Find and add" }));
    await waitFor(() =>
      expect(body).toMatchObject({
        user_id: ADDED,
        role: "school_staff",
        title: "Coordinator",
      }),
    );
  });
});

describe("school details", () => {
  it("loads the school and saves a patch", async () => {
    let body: unknown;
    mockMeAndSchools([school(ORG, "Everest School"), school(OTHER, "Janata")]);
    server.use(
      http.get(`${API}/api/v1/organisations/:id`, () => ok(organisation())),
      http.patch(`${API}/api/v1/organisations/:id`, async ({ request }) => {
        body = await request.json();
        return ok(organisation("Everest Secondary"));
      }),
    );
    renderSchool(<SchoolDetailsScreen organisationId={ORG} />);
    const name = await screen.findByRole("textbox", { name: /Name/ });
    fireEvent.change(name, { target: { value: "Everest Secondary" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Save" })[0]!);
    await waitFor(() => expect(body).toMatchObject({ name: "Everest Secondary" }));
    expect(await screen.findByText("Saved")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Janata" }).getAttribute("href")).toBe(
      `/school/${OTHER}`,
    );
  });
});
