import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { LEAD_ID, page, renderAdmin } from "./admin-test-utils";
import { DeliveriesScreen } from "./DeliveriesScreen";

const LIST = `${API}/api/v1/notifications/admin/deliveries`;
const OTHER_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9N7";

function delivery(id: string, kind: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    kind,
    channel: "sms",
    priority: "normal",
    status: "failed",
    attempts: 4,
    address: "+977 98••••4521",
    recipient_id: null,
    endpoint_id: null,
    last_error: "Gateway 503 — provider busy",
    next_attempt_at: null,
    created_at: "2026-11-25T01:00:00Z",
    updated_at: "2026-11-25T01:27:00Z",
    ...extra,
  };
}

function choose(label: string, option: string) {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: option }));
}

describe("admin deliveries", () => {
  it("lists a delivery with its channel, masked address and clock time", async () => {
    server.use(
      http.get(LIST, () =>
        page([
          delivery(LEAD_ID, "reminder.daily"),
          delivery(OTHER_ID, "enrollment.locked", {
            channel: "in_app",
            status: "sent",
            attempts: 1,
            address: "Asha Shrestha",
            last_error: null,
            updated_at: "2026-11-25T00:17:00Z",
          }),
        ]),
      ),
    );
    renderAdmin(<DeliveriesScreen />);
    expect(await screen.findByText("reminder.daily")).toBeTruthy();
    const table = screen.getByRole("table");
    expect(within(table).getByText("SMS")).toBeTruthy();
    expect(within(table).getByText("+977 98••••4521")).toBeTruthy();
    expect(within(table).getByText("Gateway 503 — provider busy")).toBeTruthy();
    expect(within(table).getByText("07:12")).toBeTruthy();
    expect(within(table).getByText("In app")).toBeTruthy();
    expect(within(table).getByText("Sent")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "When" })).toHaveProperty(
      "ariaSort",
      "descending",
    );
    expect(screen.getByRole("button", { name: "Export CSV" })).toHaveProperty("disabled", true);
    expect(screen.getAllByText("API to be added").length).toBeGreaterThan(0);
    expect(screen.getByText(/masked here/)).toBeTruthy();
  });

  it("sorts the current page by kind", async () => {
    server.use(
      http.get(LIST, () =>
        page([
          delivery(LEAD_ID, "zebra.kind", { updated_at: "2026-11-25T02:00:00Z" }),
          delivery(OTHER_ID, "alpha.kind", { updated_at: "2026-11-25T01:00:00Z" }),
        ]),
      ),
    );
    renderAdmin(<DeliveriesScreen />);
    expect(await screen.findByText("alpha.kind")).toBeTruthy();
    const kinds = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0]?.textContent);
    expect(kinds()).toEqual(["zebra.kind", "alpha.kind"]);
    fireEvent.click(screen.getByRole("button", { name: "Kind" }));
    expect(kinds()).toEqual(["alpha.kind", "zebra.kind"]);
    fireEvent.click(screen.getByRole("button", { name: "Kind" }));
    expect(kinds()).toEqual(["zebra.kind", "alpha.kind"]);
  });

  it("filters by status and channel", async () => {
    const seen: string[] = [];
    server.use(
      http.get(LIST, ({ request }) => {
        const url = new URL(request.url);
        seen.push(
          `${url.searchParams.get("status") ?? ""}|${url.searchParams.get("channel") ?? ""}`,
        );
        return page([delivery(LEAD_ID, "reminder.daily")]);
      }),
    );
    renderAdmin(<DeliveriesScreen />);
    expect(await screen.findByText("reminder.daily")).toBeTruthy();
    choose("Status", "Failed");
    choose("Channel", "SMS");
    await waitFor(() => expect(seen.at(-1)).toBe("failed|sms"));
  });

  it("pages with next and previous", async () => {
    server.use(
      http.get(LIST, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        if (cursor === "page-2") return page([delivery(OTHER_ID, "second.kind")]);
        return page([delivery(LEAD_ID, "first.kind")], "page-2");
      }),
    );
    renderAdmin(<DeliveriesScreen />);
    expect(await screen.findByText("first.kind")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Previous/ })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(await screen.findByText("second.kind")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Previous/ }));
    expect(await screen.findByText("first.kind")).toBeTruthy();
  });

  it("asks for a different page size", async () => {
    const limits: string[] = [];
    server.use(
      http.get(LIST, ({ request }) => {
        limits.push(new URL(request.url).searchParams.get("limit") ?? "");
        return page([delivery(LEAD_ID, "reminder.daily")]);
      }),
    );
    renderAdmin(<DeliveriesScreen />);
    expect(await screen.findByText("reminder.daily")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Rows per page"), { target: { value: "50" } });
    await waitFor(() => expect(limits.at(-1)).toBe("50"));
  });

  it("says there is no connection when the log cannot load", async () => {
    server.use(http.get(LIST, () => HttpResponse.error()));
    renderAdmin(<DeliveriesScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
    expect(screen.getByText(/masked here/)).toBeTruthy();
  });

  it("says the log is not allowed", async () => {
    server.use(
      http.get(LIST, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<DeliveriesScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });
});
