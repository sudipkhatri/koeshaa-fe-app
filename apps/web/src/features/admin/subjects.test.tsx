import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { renderAdmin } from "./admin-test-utils";
import { SubjectsScreen } from "./SubjectsScreen";

const GRADE_11 = "01J9Z8Y7X6W5V4T3S2R1Q0P9M7";
const GRADE_8 = "01J9Z8Y7X6W5V4T3S2R1Q0P9M8";
const STREAM = "01J9Z8Y7X6W5V4T3S2R1Q0P9M6";
const PHY = "01J9Z8Y7X6W5V4T3S2R1Q0P9L1";
const CHE = "01J9Z8Y7X6W5V4T3S2R1Q0P9L2";
const MAT = "01J9Z8Y7X6W5V4T3S2R1Q0P9L3";

const grades = [
  {
    id: GRADE_8,
    code: "8",
    name: "Class 8",
    sort_order: 8,
    has_streams: false,
    final_exam_name: "BLE",
  },
  {
    id: GRADE_11,
    code: "11",
    name: "Class 11",
    sort_order: 11,
    has_streams: true,
    final_exam_name: "",
  },
];

const streams = [{ id: STREAM, code: "SCI", name: "Science" }];

const subjects = [
  {
    id: MAT,
    grade_level_id: GRADE_11,
    stream_id: STREAM,
    code: "MAT11",
    name: "Mathematics",
    curriculum_order: 4,
  },
  {
    id: PHY,
    grade_level_id: GRADE_11,
    stream_id: STREAM,
    code: "PHY11",
    name: "Physics",
    curriculum_order: 1,
  },
  {
    id: CHE,
    grade_level_id: GRADE_11,
    stream_id: STREAM,
    code: "CHE11",
    name: "Chemistry",
    curriculum_order: 2,
  },
];

function listed(data: unknown[], total = Array.isArray(data) ? data.length : 0) {
  return HttpResponse.json({
    success: true,
    data,
    meta: { pagination: { limit: 20, offset: 0, total } },
  });
}

function mockSubjects(list: unknown[] = subjects) {
  server.use(
    http.get(`${API}/api/v1/curriculum/grade-levels`, () => listed(grades)),
    http.get(`${API}/api/v1/curriculum/streams`, () => listed(streams)),
    http.get(`${API}/api/v1/curriculum/subjects`, () => listed(list)),
    http.get(`${API}/api/v1/curriculum/availability`, () =>
      listed([
        { grade_level_id: GRADE_11, subject_id: PHY, status: "available", expected_on: null },
        { grade_level_id: GRADE_11, subject_id: CHE, status: "partial", expected_on: null },
      ]),
    ),
    http.get(`${API}/api/v1/curriculum/pool-versions`, () =>
      listed([
        {
          id: "01J9Z8Y7X6W5V4T3S2R1Q0P9K1",
          grade_level_id: GRADE_11,
          stream_id: STREAM,
          version: 2,
          optional_required: 1,
          published_at: "2026-07-16T04:15:00Z",
          published_by: null,
          created_at: "2026-07-01T04:15:00Z",
          items: [
            { subject_id: PHY, kind: "compulsory" },
            { subject_id: CHE, kind: "optional" },
          ],
        },
      ]),
    ),
  );
}

describe("admin subjects", () => {
  it("lists the grade's subjects and joins the published pool", async () => {
    mockSubjects();
    renderAdmin(<SubjectsScreen />);
    expect(await screen.findByRole("heading", { name: "Subjects" })).toBeTruthy();
    expect(await screen.findByText("Physics")).toBeTruthy();
    const text = document.body.textContent ?? "";
    expect(text.indexOf("Physics")).toBeLessThan(text.indexOf("Chemistry"));
    expect(text.indexOf("Chemistry")).toBeLessThan(text.indexOf("Mathematics"));
    expect(screen.getByText("PHY11")).toBeTruthy();
    expect(screen.getByText("Compulsory")).toBeTruthy();
    expect(screen.getByText("Optional")).toBeTruthy();
    expect(screen.getByText("Not in the pool")).toBeTruthy();
    expect(screen.getByText("Available")).toBeTruthy();
    expect(screen.getByText("Partly ready")).toBeTruthy();
    expect(screen.getByText("1–3 of 3")).toBeTruthy();
    expect(screen.getByText(/API to be added/)).toBeTruthy();
  });

  it("saves readiness for the subject chosen with Change", async () => {
    let body: unknown;
    mockSubjects();
    server.use(
      http.put(`${API}/api/v1/curriculum/availability/${GRADE_11}/${CHE}`, async ({ request }) => {
        body = await request.json();
        return listed([]);
      }),
    );
    renderAdmin(<SubjectsScreen />);
    const change = await screen.findAllByRole("button", { name: "Change" });
    const chemistry = change[1];
    if (!chemistry) throw new Error("Chemistry has no Change button");
    fireEvent.click(chemistry);
    expect(
      await screen.findByRole("heading", { name: "Ready for students — Chemistry" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "Available" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(body).toEqual({ status: "available", expected_on: null }));
  });

  it("asks before creating a subject, and keeps the typed name when offline", async () => {
    let body: unknown;
    mockSubjects();
    server.use(
      http.post(`${API}/api/v1/curriculum/subjects`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.error();
      }),
    );
    renderAdmin(<SubjectsScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Add a subject" }));
    const form = await screen.findByRole("form", { name: "Add a subject" });
    fireEvent.click(within(form).getByRole("button", { name: "Add a subject" }));
    expect(await within(form).findByText("Enter a name.")).toBeTruthy();
    fireEvent.change(within(form).getByLabelText("Name"), { target: { value: "Biology" } });
    fireEvent.change(within(form).getByLabelText("Code"), { target: { value: "BIO11" } });
    fireEvent.change(within(form).getByLabelText("Order"), { target: { value: "3" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add a subject" }));
    expect(
      await within(form).findByText("Add Biology? The name and code cannot be changed afterwards."),
    ).toBeTruthy();
    expect(body).toBeUndefined();
    fireEvent.click(within(form).getByRole("button", { name: "Add it" }));
    await waitFor(() =>
      expect(body).toEqual({
        grade_level_id: GRADE_11,
        stream_id: STREAM,
        code: "BIO11",
        name: "Biology",
        curriculum_order: 3,
      }),
    );
    expect(within(form).getByLabelText("Name")).toHaveProperty("value", "Biology");
    expect(within(form).getByRole("button", { name: "No connection" })).toBeTruthy();
  });

  it("shows an empty list", async () => {
    mockSubjects([]);
    renderAdmin(<SubjectsScreen />);
    expect(await screen.findByRole("heading", { name: "No subjects" })).toBeTruthy();
  });

  it("shows no connection when the list cannot be loaded", async () => {
    mockSubjects();
    server.use(http.get(`${API}/api/v1/curriculum/subjects`, () => HttpResponse.error()));
    renderAdmin(<SubjectsScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("shows that the list is forbidden", async () => {
    mockSubjects();
    server.use(
      http.get(`${API}/api/v1/curriculum/subjects`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<SubjectsScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });
});
