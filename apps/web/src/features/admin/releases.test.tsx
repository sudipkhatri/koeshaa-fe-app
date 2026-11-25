import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { renderAdmin } from "./admin-test-utils";
import { nextVersion, openRelease } from "./releases-api";
import { ReleasesScreen } from "./ReleasesScreen";

const YEAR = "01J9Z8Y7X6W5V4T3S2R1Q0P9Y1";
const GRADE = "01J9Z8Y7X6W5V4T3S2R1Q0P9G9";
const MATH = "01J9Z8Y7X6W5V4T3S2R1Q0P9S1";
const OPEN = "01J9Z8Y7X6W5V4T3S2R1Q0P9R8";
const LIVE = "01J9Z8Y7X6W5V4T3S2R1Q0P9R7";
const OLD = "01J9Z8Y7X6W5V4T3S2R1Q0P9R6";
const COURSE = "01J9Z8Y7X6W5V4T3S2R1Q0P9C1";
const PUBLISHER = "01J9Z8Y7X6W5V4T3S2R1Q0P9U1";

function listed(data: unknown[], total = data.length) {
  return HttpResponse.json({
    success: true,
    data,
    meta: { pagination: { limit: 100, offset: 0, total } },
  });
}

const openRow = {
  id: OPEN,
  subject_id: MATH,
  version: 8,
  notes: "Quadratic extras",
  published_at: null,
  published_by: null,
  created_at: "2026-10-20T04:15:00Z",
};

const liveRow = {
  id: LIVE,
  subject_id: MATH,
  version: 7,
  notes: "Board set",
  published_at: "2026-10-19T04:15:00Z",
  published_by: PUBLISHER,
  created_at: "2026-10-01T04:15:00Z",
};

const oldRow = {
  id: OLD,
  subject_id: MATH,
  version: 6,
  notes: null,
  published_at: "2026-09-01T04:15:00Z",
  published_by: null,
  created_at: "2026-08-01T04:15:00Z",
};

function mockReleases(releases: unknown[] = [openRow, liveRow, oldRow]) {
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
      ]),
    ),
    http.get(`${API}/api/v1/content/releases`, ({ request }) => {
      const subject = new URL(request.url).searchParams.get("subject_id");
      if (subject !== MATH) return listed([]);
      return listed(releases);
    }),
    http.get(`${API}/api/v1/content/courses`, () =>
      listed([
        {
          id: COURSE,
          subject_id: MATH,
          academic_year_id: YEAR,
          content_release_id: LIVE,
          status: "live",
          visibility: "everyone",
          starts_on: "2026-04-14",
          ends_on: "2027-04-13",
        },
      ]),
    ),
    http.get(`${API}/api/v1/users/${PUBLISHER}`, () =>
      HttpResponse.json({
        success: true,
        data: {
          id: PUBLISHER,
          account_kind: "staff",
          status: "active",
          name: "Maya Rai",
          date_of_birth: null,
          dob_source: null,
          source: "staff",
          locale: "en",
          mfa_required: false,
          under_13: null,
          identifiers: [],
          created_at: "2026-01-01T00:00:00Z",
          purge_after: null,
        },
      }),
    ),
  );
}

describe("openRelease and nextVersion", () => {
  it("picks the unpublished release with the highest version", () => {
    expect(openRelease([liveRow, openRow, oldRow])?.id).toBe(OPEN);
    expect(openRelease([liveRow, oldRow])).toBeUndefined();
  });

  it("returns one more than the highest version", () => {
    expect(nextVersion([])).toBe(1);
    expect(nextVersion([liveRow, openRow])).toBe(9);
  });
});

describe("admin releases", () => {
  it("shows the open card, pinned version and publisher", async () => {
    mockReleases();
    renderAdmin(<ReleasesScreen />);
    expect(await screen.findByRole("heading", { name: "Releases" })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: /v8/ })).toBeTruthy();
    expect(screen.getAllByText("Mathematics · Class 9").length).toBeGreaterThan(0);
    expect(screen.getByText(/A release is a numbered snapshot/i)).toBeTruthy();
    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.getByText("Quadratic extras")).toBeTruthy();
    expect(screen.getByText("Pinned")).toBeTruthy();
    expect(await screen.findByText("Maya Rai")).toBeTruthy();
    expect(screen.getByText("In use")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pin this" })).toBeTruthy();
    expect((screen.getByRole("button", { name: /Start v9/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getAllByText(/API to be added/).length).toBeGreaterThan(0);
  });

  it("starts a release when none is open", async () => {
    const created: unknown[] = [];
    mockReleases([liveRow]);
    server.use(
      http.post(`${API}/api/v1/content/releases`, async ({ request }) => {
        created.push(await request.json());
        return HttpResponse.json({
          success: true,
          data: {
            id: OPEN,
            subject_id: MATH,
            version: 8,
            notes: null,
            published_at: null,
            published_by: null,
            created_at: "2026-10-21T04:15:00Z",
          },
        });
      }),
    );
    renderAdmin(<ReleasesScreen />);
    expect(await screen.findByText("There is no open release for this subject.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Start v8/ }));
    await waitFor(() => expect(created).toEqual([{ subject_id: MATH, notes: null }]));
  });

  it("asks before publishing the open release", async () => {
    const published: string[] = [];
    mockReleases();
    server.use(
      http.post(`${API}/api/v1/content/releases/${OPEN}/publish`, () => {
        published.push(OPEN);
        return HttpResponse.json({
          success: true,
          data: { ...openRow, published_at: "2026-10-21T04:15:00Z", published_by: PUBLISHER },
        });
      }),
    );
    renderAdmin(<ReleasesScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Publish v8" }));
    fireEvent.click(screen.getByRole("button", { name: "Publish it" }));
    await waitFor(() => expect(published).toEqual([OPEN]));
  });

  it("pins a published release onto the current-year course", async () => {
    const pins: unknown[] = [];
    mockReleases([liveRow, oldRow]);
    server.use(
      http.put(`${API}/api/v1/content/courses/${COURSE}/release`, async ({ request }) => {
        pins.push(await request.json());
        return HttpResponse.json({
          success: true,
          data: {
            id: COURSE,
            subject_id: MATH,
            academic_year_id: YEAR,
            content_release_id: OLD,
            status: "live",
            visibility: "everyone",
            starts_on: "2026-04-14",
            ends_on: "2027-04-13",
          },
        });
      }),
    );
    renderAdmin(<ReleasesScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Pin this" }));
    await waitFor(() => expect(pins).toEqual([{ content_release_id: OLD }]));
  });

  it("shows empty published when the subject has only an open release", async () => {
    mockReleases([openRow]);
    renderAdmin(<ReleasesScreen />);
    expect(await screen.findByRole("heading", { name: "No published releases" })).toBeTruthy();
  });

  it("shows no connection when releases cannot be loaded", async () => {
    mockReleases();
    server.use(http.get(`${API}/api/v1/content/releases`, () => HttpResponse.error()));
    renderAdmin(<ReleasesScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("shows that the list is forbidden", async () => {
    mockReleases();
    server.use(
      http.get(`${API}/api/v1/content/releases`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<ReleasesScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });
});
