import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { LEAD_ID, page, renderAdmin } from "./admin-test-utils";
import { AccountsScreen } from "./AccountsScreen";

const LIST = `${API}/api/v1/users`;
const DUPLICATES = `${API}/api/v1/users/duplicates`;
const OTHER_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9N7";

function user(id: string, name: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    account_kind: "member",
    status: "active",
    name,
    date_of_birth: null,
    dob_source: null,
    source: "admin",
    locale: "en",
    mfa_required: false,
    under_13: null,
    identifiers: [{ id: OTHER_ID, kind: "phone", value: "+9779800000002", verified_at: null }],
    created_at: "2026-01-01T00:00:00Z",
    purge_after: null,
    ...extra,
  };
}

function choose(label: string, option: string) {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: option }));
}

function mockLists() {
  server.use(
    http.get(DUPLICATES, () => page([])),
    http.get(LIST, () => page([user(LEAD_ID, "Sita Shrestha")])),
  );
}

describe("admin accounts", () => {
  it("lists an account and explains that capacity is not stored", async () => {
    server.use(
      http.get(DUPLICATES, () => page([{ id: OTHER_ID }], "more")),
      http.get(LIST, () =>
        page([
          user(LEAD_ID, "Sita Shrestha"),
          user(OTHER_ID, "Deepa Shrestha", {
            status: "closing",
            purge_after: "2026-12-13T03:00:00Z",
            identifiers: [{ id: LEAD_ID, kind: "username", value: "asha2069", verified_at: null }],
          }),
        ]),
      ),
    );
    renderAdmin(<AccountsScreen />);
    const link = await screen.findByRole("link", { name: "Sita Shrestha" });
    expect(link.getAttribute("href")).toBe(`/admin/accounts/${LEAD_ID}`);
    expect(link.className).toContain("underline");
    expect(screen.getByText("+977 9800000002")).toBeTruthy();
    expect(screen.getByText("asha2069")).toBeTruthy();
    expect(screen.getAllByText("Member").length).toBeGreaterThan(0);
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText(/Closing · \d+ days left/)).toBeTruthy();
    expect(screen.getByText(/exact on an identifier/)).toBeTruthy();
    expect(screen.getByText(/not a field on the account/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Duplicates/ }).textContent).toContain("1+");
  });

  it("searches by an exact phone and a name prefix", async () => {
    const seen: string[] = [];
    server.use(
      http.get(DUPLICATES, () => page([])),
      http.get(LIST, ({ request }) => {
        const url = new URL(request.url);
        seen.push(
          [
            url.searchParams.get("identifier_kind") ?? "",
            url.searchParams.get("identifier") ?? "",
            url.searchParams.get("name") ?? "",
            url.searchParams.get("account_kind") ?? "",
          ].join("|"),
        );
        return page([user(LEAD_ID, "Sita Shrestha")]);
      }),
    );
    renderAdmin(<AccountsScreen />);
    expect(await screen.findByRole("link", { name: "Sita Shrestha" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "9800000002" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(seen.at(-1)).toBe("phone|+9779800000002||"));
    choose("Find by", "Name");
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Sita" } });
    choose("Account kind", "Staff");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(seen.at(-1)).toBe("||Sita|staff"));
  });

  it("keeps a phone that is not a Nepal mobile", async () => {
    mockLists();
    renderAdmin(<AccountsScreen />);
    expect(await screen.findByRole("link", { name: "Sita Shrestha" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByText("Enter a Nepal mobile number.")).toBeTruthy();
    expect(screen.getByLabelText("Phone number")).toHaveProperty("value", "123");
    expect(screen.getByRole("link", { name: "Sita Shrestha" })).toBeTruthy();
  });

  it("sorts the current page by name", async () => {
    server.use(
      http.get(DUPLICATES, () => page([])),
      http.get(LIST, () =>
        page([
          user(LEAD_ID, "Sita Shrestha", { created_at: "2026-02-01T00:00:00Z" }),
          user(OTHER_ID, "Asha Shrestha", { created_at: "2026-01-01T00:00:00Z" }),
        ]),
      ),
    );
    renderAdmin(<AccountsScreen />);
    expect(await screen.findByRole("link", { name: "Sita Shrestha" })).toBeTruthy();
    const names = () =>
      screen.getAllByRole("link", { name: /Shrestha/ }).map((link) => link.textContent);
    expect(names()).toEqual(["Sita Shrestha", "Asha Shrestha"]);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(names()).toEqual(["Asha Shrestha", "Sita Shrestha"]);
  });

  it("creates an account from a name and a phone", async () => {
    let body: unknown = null;
    mockLists();
    server.use(
      http.post(LIST, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          success: true,
          data: user(LEAD_ID, "Sita Shrestha"),
        });
      }),
    );
    renderAdmin(<AccountsScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Create an account" }));
    const panel = screen.getByRole("heading", { name: "Create an account" }).closest("section");
    if (!panel) throw new Error("Create account panel is missing");
    const form = within(panel);
    fireEvent.change(form.getByLabelText("Name"), { target: { value: "Sita Shrestha" } });
    fireEvent.change(form.getByLabelText("Phone number"), { target: { value: "9800000002" } });
    fireEvent.click(form.getByRole("button", { name: "Create an account" }));
    await waitFor(() =>
      expect(body).toEqual({
        account_kind: "member",
        name: "Sita Shrestha",
        identifiers: [{ kind: "phone", value: "+9779800000002", verified: false }],
        locale: "en",
      }),
    );
    expect(await screen.findByRole("link", { name: "Created Sita Shrestha." })).toBeTruthy();
  });

  it("keeps the new account when creating fails offline", async () => {
    mockLists();
    server.use(http.post(LIST, () => HttpResponse.error()));
    renderAdmin(<AccountsScreen />);
    fireEvent.click(await screen.findByRole("button", { name: "Create an account" }));
    const panel = screen.getByRole("heading", { name: "Create an account" }).closest("section");
    if (!panel) throw new Error("Create account panel is missing");
    const form = within(panel);
    fireEvent.change(form.getByLabelText("Name"), { target: { value: "Sita Shrestha" } });
    fireEvent.change(form.getByLabelText("Phone number"), { target: { value: "9800000002" } });
    fireEvent.click(form.getByRole("button", { name: "Create an account" }));
    expect(await screen.findByRole("button", { name: "No connection" })).toBeTruthy();
    expect(form.getByLabelText("Name")).toHaveProperty("value", "Sita Shrestha");
  });

  it("says there is no connection when accounts cannot load", async () => {
    server.use(
      http.get(DUPLICATES, () => page([])),
      http.get(LIST, () => HttpResponse.error()),
    );
    renderAdmin(<AccountsScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
  });

  it("says the list is not allowed", async () => {
    server.use(
      http.get(DUPLICATES, () => page([])),
      http.get(LIST, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<AccountsScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
  });
});
