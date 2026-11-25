import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { renderAdmin } from "./admin-test-utils";
import { CurriculumScreen } from "./CurriculumScreen";

const CURRENT = "01J9Z8Y7X6W5V4T3S2R1Q0P9N3";
const NEXT = "01J9Z8Y7X6W5V4T3S2R1Q0P9N2";
const PAST = "01J9Z8Y7X6W5V4T3S2R1Q0P9N1";
const GRADE_8 = "01J9Z8Y7X6W5V4T3S2R1Q0P9M8";
const GRADE_11 = "01J9Z8Y7X6W5V4T3S2R1Q0P9M7";
const STREAM = "01J9Z8Y7X6W5V4T3S2R1Q0P9M6";

function ok(data: unknown) {
  return HttpResponse.json({ success: true, data });
}

const years = [
  {
    id: PAST,
    label: "2082",
    starts_on: "2025-04-14",
    ends_on: "2026-04-13",
    is_current: false,
  },
  {
    id: NEXT,
    label: "2084",
    starts_on: "2027-04-14",
    ends_on: "2028-04-12",
    is_current: false,
  },
  {
    id: CURRENT,
    label: "2083",
    starts_on: "2026-04-14",
    ends_on: "2027-04-13",
    is_current: true,
  },
];

const grades = [
  {
    id: GRADE_11,
    code: "11",
    name: "Class 11",
    sort_order: 11,
    has_streams: true,
    final_exam_name: "",
  },
  {
    id: GRADE_8,
    code: "8",
    name: "Class 8",
    sort_order: 8,
    has_streams: false,
    final_exam_name: "BLE",
  },
];

const streams = [{ id: STREAM, code: "SCI", name: "Science" }];

function mockCurriculum(list: unknown[] = years) {
  server.use(
    http.get(`${API}/api/v1/curriculum/academic-years`, () => ok(list)),
    http.get(`${API}/api/v1/curriculum/grade-levels`, () => ok(grades)),
    http.get(`${API}/api/v1/curriculum/streams`, () => ok(streams)),
  );
}

describe("admin curriculum", () => {
  it("shows the current year first and works out next and past from the dates", async () => {
    mockCurriculum();
    renderAdmin(<CurriculumScreen />);
    expect(await screen.findByRole("heading", { name: "Curriculum" })).toBeTruthy();
    expect(await screen.findByText("Current")).toBeTruthy();
    expect(screen.getByText("Next")).toBeTruthy();
    expect(screen.getByText("Past")).toBeTruthy();
    const text = document.body.textContent ?? "";
    expect(text.indexOf("2083")).toBeLessThan(text.indexOf("2084"));
    expect(text.indexOf("2084")).toBeLessThan(text.indexOf("2082"));
    expect(text.indexOf("Class 8")).toBeLessThan(text.indexOf("Class 11"));
    expect(screen.getByText("Yes")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
    expect(screen.getByText("BLE")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("Science")).toBeTruthy();
    expect(screen.getByText("SCI")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Subjects" }).getAttribute("href")).toBe(
      "/admin/subjects",
    );
    expect(screen.getByRole("link", { name: "Subject pools" }).getAttribute("href")).toBe(
      "/admin/pools",
    );
    expect(
      screen.getByRole("heading", { name: "Grade levels and streams cannot be added from here" }),
    ).toBeTruthy();
    expect(screen.getByText(/Next and Past are not fields/)).toBeTruthy();
  });

  it("asks before making a year current", async () => {
    mockCurriculum();
    let called = false;
    server.use(
      http.post(`${API}/api/v1/curriculum/academic-years/${NEXT}/current`, () => {
        called = true;
        return ok(years[1]);
      }),
    );
    renderAdmin(<CurriculumScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Make current" }));
    expect(screen.getByText(/2084 becomes the only current year/)).toBeTruthy();
    expect(called).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Make it current" }));
    await waitFor(() => expect(called).toBe(true));
  });

  it("asks for a year, then creates it", async () => {
    mockCurriculum([]);
    let body: unknown;
    server.use(
      http.post(`${API}/api/v1/curriculum/academic-years`, async ({ request }) => {
        body = await request.json();
        return ok({
          id: CURRENT,
          label: "2085",
          starts_on: "2028-04-13",
          ends_on: "2029-04-13",
          is_current: false,
        });
      }),
    );
    renderAdmin(<CurriculumScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Add a year" }));
    const form = screen.getByRole("form", { name: "Add a year" });
    fireEvent.click(within(form).getByRole("button", { name: "Add a year" }));
    expect(await within(form).findByText("Enter a name.")).toBeTruthy();
    fireEvent.change(within(form).getByLabelText("Year"), { target: { value: "2085" } });
    fireEvent.change(within(form).getByLabelText("Starts"), { target: { value: "2028-04-13" } });
    fireEvent.change(within(form).getByLabelText("Ends"), { target: { value: "2029-04-13" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add a year" }));
    await waitFor(() =>
      expect(body).toEqual({
        label: "2085",
        starts_on: "2028-04-13",
        ends_on: "2029-04-13",
        is_current: false,
      }),
    );
  });

  it("saves edited dates", async () => {
    mockCurriculum();
    let body: unknown;
    server.use(
      http.patch(`${API}/api/v1/curriculum/academic-years/${CURRENT}`, async ({ request }) => {
        body = await request.json();
        return ok({ ...years[2], ends_on: "2027-04-20" });
      }),
    );
    renderAdmin(<CurriculumScreen />);
    const edit = await screen.findAllByRole("button", { name: "Edit dates" });
    const first = edit[0];
    if (!first) throw new Error("missing edit");
    fireEvent.click(first);
    const form = screen.getByRole("form", { name: "Edit dates" });
    fireEvent.change(within(form).getByLabelText("Ends"), { target: { value: "2027-04-20" } });
    fireEvent.click(within(form).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(body).toEqual({
        label: "2083",
        starts_on: "2026-04-14",
        ends_on: "2027-04-20",
      }),
    );
  });

  it("says when there are no years", async () => {
    mockCurriculum([]);
    renderAdmin(<CurriculumScreen />);
    expect(await screen.findByRole("heading", { name: "No academic years" })).toBeTruthy();
  });

  it("says there is no connection when years cannot load", async () => {
    mockCurriculum();
    server.use(http.get(`${API}/api/v1/curriculum/academic-years`, () => HttpResponse.error()));
    renderAdmin(<CurriculumScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("says you cannot do this when years are forbidden", async () => {
    mockCurriculum();
    server.use(
      http.get(`${API}/api/v1/curriculum/academic-years`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<CurriculumScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });
});
