import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { page, renderAdmin } from "./admin-test-utils";
import { matchedKeys } from "./duplicates-api";
import { DuplicatesScreen } from "./DuplicatesScreen";

const DUP = "01J9Z8Y7X6W5V4T3S2R1Q0P9D1";
const DUP2 = "01J9Z8Y7X6W5V4T3S2R1Q0P9D2";
const USER_A = "01J9Z8Y7X6W5V4T3S2R1Q0P9A1";
const USER_B = "01J9Z8Y7X6W5V4T3S2R1Q0P9B1";
const USER_C = "01J9Z8Y7X6W5V4T3S2R1Q0P9C1";
const USER_D = "01J9Z8Y7X6W5V4T3S2R1Q0P9C2";

function user(id: string, name: string, extras: Record<string, unknown> = {}) {
  return HttpResponse.json({
    success: true,
    data: {
      id,
      account_kind: "student",
      status: "active",
      name,
      date_of_birth: "2010-08-12",
      dob_source: null,
      source: "self",
      locale: "en",
      mfa_required: false,
      under_13: null,
      identifiers: [{ id: `${id}P`, kind: "phone", value: "+9779800000044", verified_at: null }],
      created_at: "2026-08-01T04:15:00Z",
      purge_after: null,
      ...extras,
    },
  });
}

function duplicateRow(overrides: Record<string, unknown> = {}) {
  return {
    id: DUP,
    user_id: USER_A,
    candidate_id: USER_B,
    matched_on: { name: true, date_of_birth: true, phone: false },
    status: "open",
    created_at: "2026-10-20T04:15:00Z",
    ...overrides,
  };
}

function mockDuplicates(items: unknown[], nextCursor: string | null = null) {
  server.use(
    http.get(`${API}/api/v1/users/duplicates`, () => page(items, nextCursor)),
    http.get(`${API}/api/v1/users/${USER_A}`, () => user(USER_A, "Ramesh Thapa")),
    http.get(`${API}/api/v1/users/${USER_B}`, () =>
      user(USER_B, "Ramesh Thapa", {
        source: "school",
        identifiers: [{ id: "u1", kind: "username", value: "ramesh.t", verified_at: null }],
      }),
    ),
    http.get(`${API}/api/v1/users/${USER_C}`, () => user(USER_C, "Puja Karki")),
    http.get(`${API}/api/v1/users/${USER_D}`, () => user(USER_D, "Sunita Karki")),
  );
}

describe("matchedKeys", () => {
  it("orders known fields first", () => {
    expect(matchedKeys({ phone: true, name: true, extra: true })).toEqual([
      "name",
      "phone",
      "extra",
    ]);
  });
});

describe("admin duplicates", () => {
  it("shows an expanded pair and can mark same person", async () => {
    const decisions: unknown[] = [];
    mockDuplicates([
      duplicateRow(),
      duplicateRow({
        id: DUP2,
        user_id: USER_C,
        candidate_id: USER_D,
        matched_on: { phone: true },
      }),
    ]);
    server.use(
      http.post(`${API}/api/v1/users/duplicates/${DUP}/decision`, async ({ request }) => {
        decisions.push(await request.json());
        return HttpResponse.json({
          success: true,
          data: { ...duplicateRow(), status: "same_person" },
        });
      }),
    );

    renderAdmin(<DuplicatesScreen />);
    expect(await screen.findByRole("heading", { name: "Possible duplicates" })).toBeTruthy();
    expect(await screen.findByText("2 open")).toBeTruthy();
    expect(screen.getByText(/Matched on name and date of birth/i)).toBeTruthy();
    expect(await screen.findAllByText("Ramesh Thapa")).not.toHaveLength(0);
    expect(screen.queryByText(USER_A)).toBeNull();
    expect((await screen.findByRole("link", { name: "Open account A" })).getAttribute("href")).toBe(
      `/admin/accounts/${USER_A}`,
    );
    expect(screen.getByRole("button", { name: "Review" })).toBeTruthy();
    expect(screen.getAllByText(/API to be added/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Same person" }));
    await waitFor(() => expect(decisions).toEqual([{ status: "same_person" }]));
  });

  it("marks different people", async () => {
    const decisions: unknown[] = [];
    mockDuplicates([duplicateRow()]);
    server.use(
      http.post(`${API}/api/v1/users/duplicates/${DUP}/decision`, async ({ request }) => {
        decisions.push(await request.json());
        return HttpResponse.json({
          success: true,
          data: { ...duplicateRow(), status: "different" },
        });
      }),
    );
    renderAdmin(<DuplicatesScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Different people" }));
    await waitFor(() => expect(decisions).toEqual([{ status: "different" }]));
  });

  it("expands a collapsed pair on review", async () => {
    mockDuplicates([
      duplicateRow(),
      duplicateRow({
        id: DUP2,
        user_id: USER_C,
        candidate_id: USER_D,
        matched_on: { phone: true },
      }),
    ]);
    renderAdmin(<DuplicatesScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Review" }));
    expect(await screen.findByRole("link", { name: "Open account A" })).toBeTruthy();
    expect(screen.getByText(/Matched on phone/i)).toBeTruthy();
  });

  it("shows an empty list", async () => {
    mockDuplicates([]);
    renderAdmin(<DuplicatesScreen />);
    expect(await screen.findByRole("heading", { name: "No open duplicates" })).toBeTruthy();
  });

  it("shows no connection when the list cannot be loaded", async () => {
    server.use(http.get(`${API}/api/v1/users/duplicates`, () => HttpResponse.error()));
    renderAdmin(<DuplicatesScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("shows that the list is forbidden", async () => {
    server.use(
      http.get(`${API}/api/v1/users/duplicates`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<DuplicatesScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });
});
