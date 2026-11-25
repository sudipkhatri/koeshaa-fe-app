import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { AccountScreen } from "./AccountScreen";
import { LEAD_ID, renderAdmin } from "./admin-test-utils";
import { ViewSessionBanner } from "./ViewSessionBanner";
import { clearViewSession } from "./view-session";

const PARENT = "01J9Z8Y7X6W5V4T3S2R1Q0P9N7";
const USERNAME = "01J9Z8Y7X6W5V4T3S2R1Q0P9N6";
const PHONE = "01J9Z8Y7X6W5V4T3S2R1Q0P9N5";
const LINK = "01J9Z8Y7X6W5V4T3S2R1Q0P9N4";

function ok(data: unknown) {
  return HttpResponse.json({ success: true, data });
}

function person(id: string, name: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    account_kind: "member",
    status: "active",
    name,
    date_of_birth: "2010-05-28",
    dob_source: "parent",
    source: "parent",
    locale: "ne",
    mfa_required: false,
    under_13: false,
    identifiers: [
      { id: USERNAME, kind: "username", value: "asha2069", verified_at: null },
      { id: PHONE, kind: "phone", value: "+9779800000002", verified_at: "2026-01-02T04:15:00Z" },
    ],
    created_at: "2026-01-02T04:15:00Z",
    purge_after: null,
    ...extra,
  };
}

function mockAccount(account = person(LEAD_ID, "Asha Shrestha")) {
  server.use(
    http.get(`${API}/api/v1/users/:userId`, ({ params }) =>
      ok(params.userId === PARENT ? person(PARENT, "Sita Shrestha", { identifiers: [] }) : account),
    ),
    http.get(`${API}/api/v1/users/:userId/consents`, () =>
      ok([
        {
          document: "terms",
          version: "2083.4",
          given_by: PARENT,
          given_at: "2026-01-02T04:15:00Z",
          current: true,
        },
      ]),
    ),
    http.get(`${API}/api/v1/users/:userId/guardianships`, () =>
      ok([
        {
          id: LINK,
          parent_id: PARENT,
          student_id: LEAD_ID,
          relationship: "mother",
          created_by: PARENT,
          state: "active",
          invited_phone: null,
          expires_at: null,
          accepted_at: "2026-01-02T04:15:00Z",
        },
      ]),
    ),
  );
}

describe("admin account", () => {
  afterEach(() => {
    clearViewSession();
  });

  it("shows the person, a guardian and a consent", async () => {
    mockAccount();
    renderAdmin(<AccountScreen userId={LEAD_ID} />);
    expect(await screen.findByRole("heading", { name: "Asha Shrestha" })).toBeTruthy();
    expect(screen.getByText(/under 13: no/)).toBeTruthy();
    expect(screen.getByText("API to be added")).toBeTruthy();
    expect(screen.getByText(/Source: parent/)).toBeTruthy();
    expect(screen.getByText("asha2069")).toBeTruthy();
    expect(screen.getByText("+977 9800000002")).toBeTruthy();
    const parent = await screen.findByRole("link", { name: "Sita Shrestha" });
    expect(parent.className).toContain("underline");
    expect(screen.getByText("Sita Shrestha (guardian)")).toBeTruthy();
    expect(screen.getByText("Current")).toBeTruthy();
    const access = screen.getByRole("link", {
      name: "Roles and permissions live on the access screen.",
    });
    expect(access.getAttribute("href")).toBe(`/admin/accounts/${LEAD_ID}/access`);
    expect(access.className).toContain("underline");
  });

  it("saves the name", async () => {
    let body: unknown;
    mockAccount();
    server.use(
      http.patch(`${API}/api/v1/users/:userId`, async ({ request }) => {
        body = await request.json();
        return ok(person(LEAD_ID, "Asha Karki"));
      }),
    );
    renderAdmin(<AccountScreen userId={LEAD_ID} />);
    const name = await screen.findByLabelText("Name");
    fireEvent.change(name, { target: { value: "Asha Karki" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(body).toMatchObject({ name: "Asha Karki", locale: "ne", date_of_birth: "2010-05-28" }),
    );
    expect(await screen.findByText("Saved")).toBeTruthy();
  });

  it("pauses with the chosen reason and does not reveal a view token", async () => {
    let reason: unknown;
    let impersonateBody: unknown = "unset";
    mockAccount();
    server.use(
      http.post(`${API}/api/v1/users/:userId/pause`, async ({ request }) => {
        reason = await request.json();
        return ok(person(LEAD_ID, "Asha Shrestha", { status: "paused" }));
      }),
      http.post(`${API}/api/v1/users/:userId/impersonate`, async ({ request }) => {
        impersonateBody = await request.text();
        return ok({
          access_token: "secret-token",
          expires_in: 1800,
          user_id: LEAD_ID,
          read_only: true,
        });
      }),
      http.post(`${API}/api/v1/users/:userId/impersonate/end`, () => ok({ ended: true })),
    );
    renderAdmin(
      <>
        <ViewSessionBanner />
        <AccountScreen userId={LEAD_ID} />
      </>,
    );
    expect(await screen.findByRole("heading", { name: "Asha Shrestha" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Pause account" }));
    await waitFor(() => expect(reason).toMatchObject({ reason: "abuse", note: null }));

    fireEvent.click(screen.getByRole("button", { name: "View as this student" }));
    expect(await screen.findByRole("dialog", { name: "View as Asha Shrestha?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Why are you opening/), {
      target: { value: "Lesson will not open" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start session" }));
    expect(await screen.findByText(/Viewing as Asha Shrestha/)).toBeTruthy();
    expect(impersonateBody).toBe("");
    expect(document.body.textContent).not.toContain("secret-token");

    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    expect(await screen.findByText(/Session ended. You viewed Asha Shrestha for/)).toBeTruthy();
  });

  it("keeps the last sign-in method", async () => {
    mockAccount(
      person(LEAD_ID, "Asha Shrestha", {
        identifiers: [{ id: PHONE, kind: "phone", value: "+9779800000002", verified_at: null }],
      }),
    );
    renderAdmin(<AccountScreen userId={LEAD_ID} />);
    const last = await screen.findByRole("button", { name: "Last one" });
    expect(last).toHaveProperty("disabled", true);
  });

  it("says there is no connection when the account cannot load", async () => {
    server.use(http.get(`${API}/api/v1/users/:userId`, () => HttpResponse.error()));
    renderAdmin(<AccountScreen userId={LEAD_ID} />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("says you cannot do this when the account is forbidden", async () => {
    server.use(
      http.get(`${API}/api/v1/users/:userId`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<AccountScreen userId={LEAD_ID} />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });

  it("explains a pause and lets the account sign in again", async () => {
    mockAccount(person(LEAD_ID, "Asha Shrestha", { status: "paused" }));
    renderAdmin(<AccountScreen userId={LEAD_ID} />);
    expect(
      await screen.findByRole("heading", { name: "Someone stopped this account signing in" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Let this account sign in again" })).toBeTruthy();
    expect(screen.getByText(/does not say who paused it/)).toBeTruthy();
  });

  it("counts the days left on a closing account and hides the stop once the date has passed", async () => {
    mockAccount(
      person(LEAD_ID, "Asha Shrestha", {
        status: "closing",
        purge_after: "2027-06-01T00:00:00Z",
      }),
    );
    renderAdmin(<AccountScreen userId={LEAD_ID} />);
    expect(await screen.findByRole("heading", { name: /days left/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stop the closure" })).toBeTruthy();
  });

  it("hides stop the closure after the purge date", async () => {
    mockAccount(
      person(LEAD_ID, "Asha Shrestha", {
        status: "closing",
        purge_after: "2020-01-01T00:00:00Z",
      }),
    );
    renderAdmin(<AccountScreen userId={LEAD_ID} />);
    expect(await screen.findByRole("heading", { name: /days left/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Stop the closure" })).toBeNull();
  });
});
