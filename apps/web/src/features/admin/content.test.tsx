import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { renderAdmin } from "./admin-test-utils";
import { ContentScreen } from "./ContentScreen";

const YEAR = "01J9Z8Y7X6W5V4T3S2R1Q0P9Y1";
const GRADE = "01J9Z8Y7X6W5V4T3S2R1Q0P9G9";
const MATH = "01J9Z8Y7X6W5V4T3S2R1Q0P9S1";
const NEPALI = "01J9Z8Y7X6W5V4T3S2R1Q0P9S2";
const LIVE = "01J9Z8Y7X6W5V4T3S2R1Q0P9R7";
const DRAFT = "01J9Z8Y7X6W5V4T3S2R1Q0P9R1";

function listed(data: unknown[], total = data.length) {
  return HttpResponse.json({
    success: true,
    data,
    meta: { pagination: { limit: 20, offset: 0, total } },
  });
}

function mockContent() {
  server.use(
    http.get(`${API}/api/v1/curriculum/academic-years`, () =>
      listed([
        {
          id: YEAR,
          label: "2083",
          starts_on: "2026-04-14",
          ends_on: "2027-04-13",
          is_current: true,
        },
      ]),
    ),
    http.get(`${API}/api/v1/curriculum/grade-levels`, () =>
      listed([
        {
          id: GRADE,
          code: "9",
          name: "Class 9",
          sort_order: 9,
          has_streams: false,
          final_exam_name: "",
        },
      ]),
    ),
    http.get(`${API}/api/v1/curriculum/subjects`, () =>
      listed([
        {
          id: MATH,
          grade_level_id: GRADE,
          stream_id: null,
          code: "MAT9",
          name: "Mathematics",
          curriculum_order: 1,
        },
        {
          id: NEPALI,
          grade_level_id: GRADE,
          stream_id: null,
          code: "NEP9",
          name: "Nepali",
          curriculum_order: 2,
        },
      ]),
    ),
    http.get(`${API}/api/v1/content/courses`, () =>
      listed(
        [
          {
            id: "01J9Z8Y7X6W5V4T3S2R1Q0P9C1",
            subject_id: MATH,
            academic_year_id: YEAR,
            content_release_id: LIVE,
            status: "live",
            visibility: "everyone",
            starts_on: "2026-04-14",
            ends_on: "2027-04-13",
          },
          {
            id: "01J9Z8Y7X6W5V4T3S2R1Q0P9C2",
            subject_id: NEPALI,
            academic_year_id: YEAR,
            content_release_id: DRAFT,
            status: "draft",
            visibility: "staff",
            starts_on: null,
            ends_on: null,
          },
        ],
        54,
      ),
    ),
    http.get(`${API}/api/v1/content/releases`, ({ request }) => {
      const subject = new URL(request.url).searchParams.get("subject_id");
      if (subject === NEPALI) {
        return listed([
          {
            id: DRAFT,
            subject_id: NEPALI,
            version: 1,
            notes: null,
            published_at: null,
            published_by: null,
            created_at: "2026-08-01T04:15:00Z",
          },
        ]);
      }
      return listed([
        {
          id: LIVE,
          subject_id: MATH,
          version: 7,
          notes: null,
          published_at: "2026-10-19T04:15:00Z",
          published_by: null,
          created_at: "2026-10-01T04:15:00Z",
        },
      ]);
    }),
    http.get(`${API}/api/v1/content/changes`, () => listed([], 3)),
  );
}

describe("admin content", () => {
  it("joins the subject name and shows the pinned version", async () => {
    mockContent();
    renderAdmin(<ContentScreen />);
    expect(await screen.findByRole("heading", { name: "Content" })).toBeTruthy();
    expect(await screen.findByText("Mathematics · Class 9")).toBeTruthy();
    expect(screen.getByText("Nepali · Class 9")).toBeTruthy();
    const version = await screen.findByRole("link", { name: "v7" });
    expect(version.getAttribute("href")).toBe("/admin/releases");
    expect(version.className).not.toContain("underline");
    expect(screen.getByText("Live")).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
    expect(screen.getByText("Everyone")).toBeTruthy();
    expect(screen.getByText("Staff only")).toBeTruthy();
    expect(screen.getByText("never published")).toBeTruthy();
    expect(screen.getByText("Not set")).toBeTruthy();
    expect(screen.getByText("1–2 of 54")).toBeTruthy();
    expect(screen.getByRole("button", { name: "1", current: "page" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "3" })).toBeTruthy();
    const pending = screen.getByRole("link", { name: /Pending edits/ });
    expect(pending.getAttribute("href")).toBe("/admin/content/changes");
    expect(pending.textContent).toContain("3");
    expect(screen.getByRole("link", { name: "Add content" }).getAttribute("href")).toBe(
      "/admin/content/new",
    );
    const change = screen.getAllByRole("link", { name: "Change version" })[0];
    expect(change?.getAttribute("href")).toBe("/admin/releases");
    expect(change?.className).not.toContain("underline");
    expect(screen.getByText(/API to be added/)).toBeTruthy();
  });

  it("shows an empty year", async () => {
    mockContent();
    server.use(http.get(`${API}/api/v1/content/courses`, () => listed([])));
    renderAdmin(<ContentScreen />);
    expect(await screen.findByRole("heading", { name: "No content" })).toBeTruthy();
  });

  it("shows no connection when courses cannot be loaded", async () => {
    mockContent();
    server.use(http.get(`${API}/api/v1/content/courses`, () => HttpResponse.error()));
    renderAdmin(<ContentScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("shows that the list is forbidden", async () => {
    mockContent();
    server.use(
      http.get(`${API}/api/v1/content/courses`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<ContentScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });
});
