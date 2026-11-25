import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { renderAdmin } from "./admin-test-utils";
import { ContentChangesScreen } from "./ContentChangesScreen";

const CHANGE = "01J9Z8Y7X6W5V4T3S2R1Q0P9C9";
const APPLIED = "01J9Z8Y7X6W5V4T3S2R1Q0P9C8";
const AUTHOR = "01J9Z8Y7X6W5V4T3S2R1Q0P9U1";
const ENTITY = "01J9Z8Y7X6W5V4T3S2R1Q0P9Q9";

function listed(data: unknown[], total = data.length) {
  return HttpResponse.json({
    success: true,
    data,
    meta: { pagination: { limit: 20, offset: 0, total } },
  });
}

function mockChanges(
  items: Array<{ status: string } & Record<string, unknown>>,
  total = items.length,
) {
  server.use(
    http.get(`${API}/api/v1/content/changes`, ({ request }) => {
      const status = new URL(request.url).searchParams.get("status");
      if (status === "waiting" && new URL(request.url).searchParams.get("limit") === "1") {
        return listed([], 3);
      }
      const page = status ? items.filter((item) => item.status === status) : items;
      return listed(page, status ? page.length : total);
    }),
    http.get(`${API}/api/v1/users/${AUTHOR}`, () =>
      HttpResponse.json({
        success: true,
        data: {
          id: AUTHOR,
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

describe("admin content edits", () => {
  it("lists a waiting edit and can approve it", async () => {
    const decisions: unknown[] = [];
    mockChanges(
      [
        {
          id: CHANGE,
          entity_type: "question",
          entity_id: ENTITY,
          proposed: { explanation: "Half of 6 is 3, and 3² is 9, so add 9.", answer_key: "9" },
          author_id: AUTHOR,
          status: "waiting",
          reviewer_id: null,
          notes: null,
          decided_at: null,
          content_release_id: null,
          created_at: "2026-10-28T04:15:00Z",
          updated_at: "2026-10-28T04:15:00Z",
        },
        {
          id: APPLIED,
          entity_type: "topic",
          entity_id: ENTITY,
          proposed: { name: "Completing the square" },
          author_id: AUTHOR,
          status: "applied",
          reviewer_id: null,
          notes: null,
          decided_at: null,
          content_release_id: null,
          created_at: "2026-10-27T04:15:00Z",
          updated_at: "2026-10-27T04:15:00Z",
        },
      ],
      31,
    );
    server.use(
      http.post(`${API}/api/v1/content/changes/${CHANGE}/decision`, async ({ request }) => {
        decisions.push(await request.json());
        return HttpResponse.json({
          success: true,
          data: {
            id: CHANGE,
            entity_type: "question",
            entity_id: ENTITY,
            proposed: { answer_key: "9" },
            author_id: AUTHOR,
            status: "approved",
            reviewer_id: AUTHOR,
            notes: null,
            decided_at: "2026-10-28T05:00:00Z",
            content_release_id: null,
            created_at: "2026-10-28T04:15:00Z",
            updated_at: "2026-10-28T05:00:00Z",
          },
        });
      }),
    );

    renderAdmin(<ContentChangesScreen />);
    expect(await screen.findByRole("heading", { name: "Edits" })).toBeTruthy();
    expect(await screen.findByText("3 waiting")).toBeTruthy();
    expect(await screen.findAllByText(/Maya Rai/)).toHaveLength(1);
    expect(screen.getAllByText("Waiting").length).toBeGreaterThan(0);
    expect(screen.getByText("Proposed")).toBeTruthy();
    expect(screen.getByText(/Half of 6 is 3/)).toBeTruthy();
    expect(screen.getByText("1–1 of 1")).toBeTruthy();
    expect(screen.getByText(/API to be added/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(decisions).toEqual([{ decision: "approved", notes: null }]));
  });

  it("shows an applied edit without a decision", async () => {
    mockChanges([
      {
        id: APPLIED,
        entity_type: "topic",
        entity_id: ENTITY,
        proposed: { name: "Completing the square" },
        author_id: AUTHOR,
        status: "applied",
        reviewer_id: null,
        notes: null,
        decided_at: null,
        content_release_id: null,
        created_at: "2026-10-27T04:15:00Z",
        updated_at: "2026-10-27T04:15:00Z",
      },
    ]);
    renderAdmin(<ContentChangesScreen />);
    fireEvent.click(await screen.findByLabelText("Status"));
    fireEvent.click(await screen.findByRole("option", { name: "Applied at once" }));
    expect(await screen.findByRole("button", { name: "See it" })).toBeTruthy();
    expect((screen.getByRole("button", { name: "See it" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByText(/server applied it/i)).toBeTruthy();
  });

  it("rejects with an optional note", async () => {
    const decisions: unknown[] = [];
    mockChanges([
      {
        id: CHANGE,
        entity_type: "question",
        entity_id: ENTITY,
        proposed: { stem: "What is added?" },
        author_id: AUTHOR,
        status: "waiting",
        reviewer_id: null,
        notes: null,
        decided_at: null,
        content_release_id: null,
        created_at: "2026-10-28T04:15:00Z",
        updated_at: "2026-10-28T04:15:00Z",
      },
    ]);
    server.use(
      http.post(`${API}/api/v1/content/changes/${CHANGE}/decision`, async ({ request }) => {
        decisions.push(await request.json());
        return HttpResponse.json({
          success: true,
          data: {
            id: CHANGE,
            entity_type: "question",
            entity_id: ENTITY,
            proposed: { stem: "What is added?" },
            author_id: AUTHOR,
            status: "rejected",
            reviewer_id: AUTHOR,
            notes: "Wrong mark scheme",
            decided_at: "2026-10-28T05:00:00Z",
            content_release_id: null,
            created_at: "2026-10-28T04:15:00Z",
            updated_at: "2026-10-28T05:00:00Z",
          },
        });
      }),
    );

    renderAdmin(<ContentChangesScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Reject" }));
    fireEvent.change(screen.getByLabelText("Note"), { target: { value: "Wrong mark scheme" } });
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    await waitFor(() =>
      expect(decisions).toEqual([{ decision: "rejected", notes: "Wrong mark scheme" }]),
    );
  });

  it("shows an empty list", async () => {
    mockChanges([]);
    renderAdmin(<ContentChangesScreen />);
    expect(await screen.findByRole("heading", { name: "No edits" })).toBeTruthy();
  });

  it("shows no connection when the list cannot load", async () => {
    server.use(http.get(`${API}/api/v1/content/changes`, () => HttpResponse.error()));
    renderAdmin(<ContentChangesScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("shows that the list is forbidden", async () => {
    server.use(
      http.get(`${API}/api/v1/content/changes`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<ContentChangesScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });
});
