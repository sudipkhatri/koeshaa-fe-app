import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { API, server } from "@/test/server";

import { LEAD_ID, page, renderAdmin } from "./admin-test-utils";
import { WebhooksScreen } from "./WebhooksScreen";

const LIST = `${API}/api/v1/notifications/admin/webhooks`;
const OTHER_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9N7";

function webhook(id: string, name: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    name,
    url: "https://hooks.slack.com/services/T123/B456/secretvalue",
    format: "slack",
    events: ["new_feedback"],
    active: true,
    created_at: "2026-01-01T00:00:00Z",
    ...extra,
  };
}

function created(secret = "secret-once") {
  return HttpResponse.json({
    success: true,
    data: { ...webhook(LEAD_ID, "Support alerts"), signing_secret: secret },
  });
}

function addForm(): HTMLElement {
  const form = screen.getByRole("heading", { name: "Add webhook" }).closest("section");
  if (!form) throw new Error("Add webhook form is missing");
  return form;
}

function fillWebhook(url = "https://example.test/hook") {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Support alerts" } });
  fireEvent.change(screen.getByLabelText("URL"), { target: { value: url } });
  fireEvent.change(screen.getByLabelText("Events"), { target: { value: "new_feedback" } });
}

function clipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

describe("admin webhooks", () => {
  it("shows the host only, the format and whether the endpoint is paused", async () => {
    let release: (response: Response) => void = () => undefined;
    const pending = new Promise<Response>((resolve) => {
      release = resolve;
    });
    server.use(http.get(LIST, () => pending));
    renderAdmin(<WebhooksScreen />);
    expect(await screen.findByRole("status", { name: "Loading" })).toBeTruthy();
    release(
      page([
        webhook(LEAD_ID, "Support alerts"),
        webhook(OTHER_ID, "Teams billing", {
          url: "hooks.office.com/webhook/•••",
          format: "teams",
          events: ["payment_failed", "renewed"],
          active: false,
        }),
      ]),
    );
    expect(await screen.findByText("hooks.slack.com/•••")).toBeTruthy();
    expect(screen.getByText("hooks.office.com/webhook/•••")).toBeTruthy();
    expect(screen.queryByText(/secretvalue/)).toBeNull();
    expect(screen.queryByText(/T123/)).toBeNull();
    const table = screen.getByRole("table");
    expect(within(table).getByText("Slack")).toBeTruthy();
    expect(within(table).getByText("Teams")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pause Support alerts" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Turn on Teams billing" })).toBeTruthy();
    expect(screen.getByText("payment_failed, renewed")).toBeTruthy();
  });

  it("says there is no connection when the list cannot load", async () => {
    server.use(http.get(LIST, () => HttpResponse.error()));
    renderAdmin(<WebhooksScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
    expect(screen.getByLabelText("Name")).toBeTruthy();
  });

  it("says the list is not allowed", async () => {
    server.use(
      http.get(LIST, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<WebhooksScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });

  it("sorts the loaded webhooks by name", async () => {
    server.use(
      http.get(LIST, () =>
        page([webhook(LEAD_ID, "Zebra alerts"), webhook(OTHER_ID, "Alpha alerts")]),
      ),
    );
    renderAdmin(<WebhooksScreen />);
    expect(await screen.findByText("Alpha alerts")).toBeTruthy();
    const names = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[0]?.textContent);
    expect(names()).toEqual(["Alpha alerts", "Zebra alerts"]);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(names()).toEqual(["Zebra alerts", "Alpha alerts"]);
  });

  it("pauses an endpoint from its state", async () => {
    let body: unknown = null;
    server.use(
      http.get(LIST, () => page([webhook(LEAD_ID, "Support alerts")])),
      http.patch(`${LIST}/${LEAD_ID}`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          success: true,
          data: webhook(LEAD_ID, "Support alerts", { active: false }),
        });
      }),
    );
    renderAdmin(<WebhooksScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Pause Support alerts" }));
    await waitFor(() => expect(body).toEqual({ active: false }));
  });

  it("removes an endpoint", async () => {
    let removed = false;
    server.use(
      http.get(LIST, () => page([webhook(LEAD_ID, "Support alerts")])),
      http.delete(`${LIST}/${LEAD_ID}`, () => {
        removed = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderAdmin(<WebhooksScreen />);
    const row = await screen.findByRole("row", { name: /Support alerts/ });
    fireEvent.click(within(row).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(removed).toBe(true));
  });

  it("keeps a URL that is not a full address", async () => {
    server.use(http.get(LIST, () => page([])));
    renderAdmin(<WebhooksScreen />);
    await screen.findByRole("heading", { name: "No webhooks" });
    fillWebhook("not-a-url");
    fireEvent.click(within(addForm()).getByRole("button", { name: "Add webhook" }));
    expect(await screen.findByText("Enter a full http or https URL.")).toBeTruthy();
    expect(screen.getByLabelText("URL")).toHaveProperty("value", "not-a-url");
  });

  it("puts a server validation error on the URL and keeps what was typed", async () => {
    server.use(
      http.get(LIST, () => page([])),
      http.post(LIST, () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "bad host from the server",
              details: [{ field: "url", code: "invalid", message: "bad host from the server" }],
            },
          },
          { status: 422 },
        ),
      ),
    );
    renderAdmin(<WebhooksScreen />);
    await screen.findByRole("heading", { name: "No webhooks" });
    fillWebhook();
    fireEvent.click(within(addForm()).getByRole("button", { name: "Add webhook" }));
    expect(await screen.findAllByText("Please check what you typed and try again.")).toBeTruthy();
    expect(screen.queryByText("bad host from the server")).toBeNull();
    expect(screen.getByLabelText("URL")).toHaveProperty("value", "https://example.test/hook");
    expect(screen.getByLabelText("Name")).toHaveProperty("value", "Support alerts");
  });

  it("keeps the typed webhook when adding fails offline", async () => {
    server.use(
      http.get(LIST, () => page([])),
      http.post(LIST, () => HttpResponse.error()),
    );
    renderAdmin(<WebhooksScreen />);
    await screen.findByRole("heading", { name: "No webhooks" });
    fillWebhook();
    fireEvent.click(within(addForm()).getByRole("button", { name: "Add webhook" }));
    expect(await screen.findByRole("button", { name: "No connection" })).toBeTruthy();
    expect(screen.getByLabelText("Name")).toHaveProperty("value", "Support alerts");
    expect(screen.getByLabelText("Events")).toHaveProperty("value", "new_feedback");
  });

  it("copies the signing secret and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard(writeText);
    server.use(
      http.get(LIST, () => page([])),
      http.post(LIST, () => created()),
    );
    renderAdmin(<WebhooksScreen />);
    await screen.findByRole("heading", { name: "No webhooks" });
    fillWebhook();
    fireEvent.click(within(addForm()).getByRole("button", { name: "Add webhook" }));
    expect(await screen.findByText("secret-once")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("secret-once"));
    expect(await screen.findByRole("button", { name: "Copied" })).toBeTruthy();
  });

  it("says the secret could not be copied", async () => {
    clipboard(vi.fn().mockRejectedValue(new Error("denied")));
    server.use(
      http.get(LIST, () => page([])),
      http.post(LIST, () => created()),
    );
    renderAdmin(<WebhooksScreen />);
    await screen.findByRole("heading", { name: "No webhooks" });
    fillWebhook();
    fireEvent.click(within(addForm()).getByRole("button", { name: "Add webhook" }));
    fireEvent.click(await screen.findByRole("button", { name: "Copy" }));
    expect(
      await screen.findByText("Could not copy. Select the secret and copy it yourself."),
    ).toBeTruthy();
    expect(screen.getByText("secret-once")).toBeTruthy();
  });

  it("sends one webhook while the first request is still running", async () => {
    let calls = 0;
    let release: () => void = () => undefined;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get(LIST, () => page([])),
      http.post(LIST, async () => {
        calls += 1;
        await hold;
        return created();
      }),
    );
    renderAdmin(<WebhooksScreen />);
    await screen.findByRole("heading", { name: "No webhooks" });
    fillWebhook();
    const button = within(addForm()).getByRole("button", { name: "Add webhook" });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveProperty("disabled", true));
    expect(calls).toBe(1);
    release();
    expect(await screen.findByText("secret-once")).toBeTruthy();
    expect(calls).toBe(1);
  });
});
