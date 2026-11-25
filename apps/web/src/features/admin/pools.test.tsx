import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { renderAdmin } from "./admin-test-utils";
import { PoolScreen } from "./PoolScreen";

const GRADE_11 = "01J9Z8Y7X6W5V4T3S2R1Q0P9M7";
const STREAM = "01J9Z8Y7X6W5V4T3S2R1Q0P9M6";
const PHY = "01J9Z8Y7X6W5V4T3S2R1Q0P9L1";
const NEP = "01J9Z8Y7X6W5V4T3S2R1Q0P9L4";
const DRAFT = "01J9Z8Y7X6W5V4T3S2R1Q0P9K3";
const LIVE = "01J9Z8Y7X6W5V4T3S2R1Q0P9K2";

const grades = [
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
    id: PHY,
    grade_level_id: GRADE_11,
    stream_id: STREAM,
    code: "PHY11",
    name: "Physics",
    curriculum_order: 1,
  },
  {
    id: NEP,
    grade_level_id: GRADE_11,
    stream_id: STREAM,
    code: "NEP11",
    name: "Nepali",
    curriculum_order: 2,
  },
];

function listed(data: unknown[]) {
  return HttpResponse.json({
    success: true,
    data,
    meta: { pagination: { limit: 100, offset: 0, total: data.length } },
  });
}

const draft = {
  id: DRAFT,
  grade_level_id: GRADE_11,
  stream_id: STREAM,
  version: 3,
  optional_required: 1,
  published_at: null,
  published_by: null,
  created_at: "2026-10-23T04:15:00Z",
  items: [{ subject_id: PHY, kind: "compulsory" }],
};

const live = {
  id: LIVE,
  grade_level_id: GRADE_11,
  stream_id: STREAM,
  version: 2,
  optional_required: 1,
  published_at: "2026-07-16T04:15:00Z",
  published_by: null,
  created_at: "2026-07-01T04:15:00Z",
  items: [{ subject_id: PHY, kind: "compulsory" }],
};

function mockPools(versions: unknown[] = [draft, live]) {
  server.use(
    http.get(`${API}/api/v1/curriculum/grade-levels`, () => listed(grades)),
    http.get(`${API}/api/v1/curriculum/streams`, () => listed(streams)),
    http.get(`${API}/api/v1/curriculum/pool-versions`, () => listed(versions)),
    http.get(`${API}/api/v1/curriculum/subjects`, () => listed(subjects)),
    http.get(`${API}/api/v1/curriculum/availability`, () =>
      listed([
        { grade_level_id: GRADE_11, subject_id: PHY, status: "available", expected_on: null },
      ]),
    ),
  );
}

describe("admin subject pools", () => {
  it("shows the draft and the live version", async () => {
    mockPools();
    renderAdmin(<PoolScreen />);
    expect(await screen.findByRole("heading", { name: /Subject pool/ })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: /v3/ })).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
    expect(screen.getByText("Live")).toBeTruthy();
    expect(screen.getByText("Physics")).toBeTruthy();
    expect(screen.getByText("PHY11")).toBeTruthy();
    expect(screen.getByText(/1 compulsory, 0 optional, pick 1/)).toBeTruthy();
    expect(screen.getByText(/API to be added/)).toBeTruthy();
  });

  it("does not publish until the confirmation", async () => {
    let published = 0;
    mockPools();
    server.use(
      http.post(`${API}/api/v1/curriculum/pool-versions/${DRAFT}/publish`, () => {
        published += 1;
        return listed([]);
      }),
    );
    renderAdmin(<PoolScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Publish v3" }));
    expect(published).toBe(0);
    expect(
      screen.getByText("Publish v3 for Class 11 · Science? There is no unpublish."),
    ).toBeTruthy();
    expect(screen.getByText("Nothing is different from the live version.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Publish it" }));
    await waitFor(() => expect(published).toBe(1));
  });

  it("moves a subject to optional and can add one that is not in the draft", async () => {
    const bodies: unknown[] = [];
    mockPools();
    server.use(
      http.put(`${API}/api/v1/curriculum/pool-versions/${DRAFT}/items`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ success: true, data: draft });
      }),
    );
    renderAdmin(<PoolScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Make optional" }));
    await waitFor(() => expect(bodies[0]).toEqual({ subject_id: PHY, kind: "optional" }));
    fireEvent.click(screen.getByLabelText("Add a subject to this pool"));
    const list = screen.getByRole("listbox");
    expect(list.className).toContain("bottom-full");
    fireEvent.click(within(list).getByRole("option", { name: "Nepali · NEP11" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(bodies[1]).toEqual({ subject_id: NEP, kind: "optional" }));
  });

  it("starts a version when the grade has none", async () => {
    let body: unknown;
    mockPools([]);
    server.use(
      http.post(`${API}/api/v1/curriculum/pool-versions`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true, data: draft }, { status: 201 });
      }),
    );
    renderAdmin(<PoolScreen />);
    expect(await screen.findByRole("heading", { name: "No pool yet" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start a version" }));
    await waitFor(() =>
      expect(body).toEqual({
        grade_level_id: GRADE_11,
        stream_id: STREAM,
        optional_required: 0,
        items: [],
      }),
    );
  });

  it("shows no connection when versions cannot be loaded", async () => {
    mockPools();
    server.use(http.get(`${API}/api/v1/curriculum/pool-versions`, () => HttpResponse.error()));
    renderAdmin(<PoolScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("shows that versions are forbidden", async () => {
    mockPools();
    server.use(
      http.get(`${API}/api/v1/curriculum/pool-versions`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<PoolScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });
});
