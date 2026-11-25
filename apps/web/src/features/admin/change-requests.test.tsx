import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { renderAdmin } from "./admin-test-utils";
import { ChangeRequestsScreen } from "./ChangeRequestsScreen";
import { nameInitials, proposedFields } from "./change-requests-api";

const REQUEST = "01J9Z8Y7X6W5V4T3S2R1Q0P9R1";
const OTHER = "01J9Z8Y7X6W5V4T3S2R1Q0P9R2";
const STUDENT = "01J9Z8Y7X6W5V4T3S2R1Q0P9S1";
const DECIDER = "01J9Z8Y7X6W5V4T3S2R1Q0P9U1";
const GRADE = "01J9Z8Y7X6W5V4T3S2R1Q0P9G9";
const STREAM = "01J9Z8Y7X6W5V4T3S2R1Q0P9M6";
const PHY = "01J9Z8Y7X6W5V4T3S2R1Q0P9L1";

function listed(data: unknown[], total = data.length) {
  return HttpResponse.json({
    success: true,
    data,
    meta: { pagination: { limit: 20, offset: 0, total } },
  });
}

function user(id: string, name: string) {
  return HttpResponse.json({
    success: true,
    data: {
      id,
      account_kind: "student",
      status: "active",
      name,
      date_of_birth: null,
      dob_source: null,
      source: "self",
      locale: "en",
      mfa_required: false,
      under_13: null,
      identifiers: [],
      created_at: "2026-01-01T00:00:00Z",
      purge_after: null,
    },
  });
}

function requestRow(overrides: Record<string, unknown> = {}) {
  return {
    id: REQUEST,
    enrollment_id: "01J9Z8Y7X6W5V4T3S2R1Q0P9E1",
    student_id: STUDENT,
    type: "change_stream",
    reason_code: "wrong_stream",
    reason_text: "I picked Management by mistake.",
    proposed: {
      grade_level_id: GRADE,
      stream_id: STREAM,
      optional_subject_ids: [PHY],
    },
    status: "submitted",
    decided_by: null,
    decided_at: null,
    decision_note: null,
    created_at: "2026-10-22T04:15:00Z",
    ...overrides,
  };
}

function mockCatalog() {
  server.use(
    http.get(`${API}/api/v1/curriculum/grade-levels`, () =>
      listed([
        {
          id: GRADE,
          code: "11",
          name: "Class 11",
          sort_order: 11,
          has_streams: true,
          final_exam_name: "",
        },
      ]),
    ),
    http.get(`${API}/api/v1/curriculum/streams`, () =>
      listed([{ id: STREAM, code: "SCI", name: "Science" }]),
    ),
    http.get(`${API}/api/v1/curriculum/subjects`, () =>
      listed([
        {
          id: PHY,
          grade_level_id: GRADE,
          stream_id: STREAM,
          code: "PHY11",
          name: "Physics",
          curriculum_order: 1,
        },
      ]),
    ),
    http.get(`${API}/api/v1/users/${STUDENT}`, () => user(STUDENT, "Sabina Khadka")),
    http.get(`${API}/api/v1/users/${DECIDER}`, () => user(DECIDER, "Bina Karki")),
  );
}

function mockRequests(items: unknown[], total = items.length, waitingTotal = total) {
  mockCatalog();
  server.use(
    http.get(`${API}/api/v1/enrollment/change-requests`, ({ request }) => {
      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      const limit = url.searchParams.get("limit");
      if (status === "submitted" && limit === "1") {
        return listed([], waitingTotal);
      }
      const page = status
        ? items.filter((item) => (item as { status: string }).status === status)
        : items;
      return listed(page, status ? page.length : total);
    }),
  );
}

describe("change request helpers", () => {
  it("reads proposed ids and initials", () => {
    expect(
      proposedFields({
        grade_level_id: GRADE,
        stream_id: STREAM,
        optional_subject_ids: [PHY],
      }),
    ).toEqual({ gradeLevelId: GRADE, streamId: STREAM, optionalIds: [PHY] });
    expect(nameInitials("Sabina Khadka")).toBe("SK");
  });
});

describe("admin change requests", () => {
  it("lists a waiting request and can approve it", async () => {
    const decisions: unknown[] = [];
    mockRequests([requestRow(), requestRow({ id: OTHER, type: "change_optionals" })], 9, 9);
    server.use(
      http.post(
        `${API}/api/v1/enrollment/change-requests/${REQUEST}/decision`,
        async ({ request }) => {
          decisions.push(await request.json());
          return HttpResponse.json({
            success: true,
            data: requestRow({
              status: "approved",
              decided_by: DECIDER,
              decided_at: "2026-10-22T05:00:00Z",
            }),
          });
        },
      ),
    );

    renderAdmin(<ChangeRequestsScreen />);
    expect(await screen.findByRole("heading", { name: "Change requests" })).toBeTruthy();
    expect(await screen.findByText("9 waiting")).toBeTruthy();
    expect(await screen.findAllByRole("link", { name: "Sabina Khadka" })).not.toHaveLength(0);
    expect(screen.queryByText(STUDENT)).toBeNull();
    expect(screen.getByText("Wrong stream")).toBeTruthy();
    expect(screen.getByText(/I picked Management/)).toBeTruthy();
    expect(screen.getByText(/Class 11 · Science/)).toBeTruthy();
    expect(screen.getAllByText(/API to be added/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Note"), {
      target: { value: "Moved to Science" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Approve the change" }));
    await waitFor(() =>
      expect(decisions).toEqual([{ decision: "approved", note: "Moved to Science" }]),
    );
  });

  it("refuses with an optional note", async () => {
    const decisions: unknown[] = [];
    mockRequests([requestRow()]);
    server.use(
      http.post(
        `${API}/api/v1/enrollment/change-requests/${REQUEST}/decision`,
        async ({ request }) => {
          decisions.push(await request.json());
          return HttpResponse.json({
            success: true,
            data: requestRow({
              status: "refused",
              decided_by: DECIDER,
              decided_at: "2026-10-22T05:00:00Z",
              decision_note: "Not yet",
            }),
          });
        },
      ),
    );
    renderAdmin(<ChangeRequestsScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Refuse" }));
    await waitFor(() => expect(decisions).toEqual([{ decision: "refused", note: null }]));
  });

  it("shows a refused request without actions", async () => {
    mockRequests([
      requestRow({
        status: "refused",
        decided_by: DECIDER,
        decided_at: "2026-10-20T04:15:00Z",
        decision_note: "Class 12 opens in Baisakh.",
      }),
    ]);
    renderAdmin(<ChangeRequestsScreen />);
    fireEvent.click(await screen.findByLabelText("Status"));
    fireEvent.click(await screen.findByRole("option", { name: "Refused" }));
    expect(await screen.findByText(/Refused by Bina Karki/)).toBeTruthy();
    expect(screen.getByText(/Class 12 opens in Baisakh/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve the change" })).toBeNull();
  });

  it("shows an empty queue", async () => {
    mockRequests([]);
    renderAdmin(<ChangeRequestsScreen />);
    expect(await screen.findByRole("heading", { name: "No change requests" })).toBeTruthy();
  });

  it("shows no connection when the list cannot be loaded", async () => {
    mockCatalog();
    server.use(http.get(`${API}/api/v1/enrollment/change-requests`, () => HttpResponse.error()));
    renderAdmin(<ChangeRequestsScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("shows that the list is forbidden", async () => {
    mockCatalog();
    server.use(
      http.get(`${API}/api/v1/enrollment/change-requests`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<ChangeRequestsScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });
});
