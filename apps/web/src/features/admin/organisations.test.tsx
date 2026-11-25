import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { LocaleProvider } from "@/lib/locale";
import { setAccessToken } from "@/lib/session";
import { API, server } from "@/test/server";

import { OrganisationScreen } from "./OrganisationScreen";

const ORG_ID = "01J9Z8Y7X6W5V4T3S2R1Q0P9N8";

function renderSchools(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <LocaleProvider>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </LocaleProvider>,
  );
}

function organisation(name: string) {
  return {
    id: ORG_ID,
    name,
    kind: "school",
    status: "active",
    vat_registered: false,
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("schools", () => {
  beforeEach(() => {
    setAccessToken("access-1");
    server.use(
      http.get(`${API}/api/v1/me/schools`, () => HttpResponse.json({ success: true, data: [] })),
      http.get(`${API}/api/v1/organisations/:id/members`, () =>
        HttpResponse.json({
          success: true,
          data: [],
          meta: { pagination: { limit: 20, next_cursor: null, has_more: false } },
        }),
      ),
    );
  });

  it("saves a school name through the profile update", async () => {
    let body: { name?: string } | undefined;
    server.use(
      http.get(`${API}/api/v1/organisations/:id`, () =>
        HttpResponse.json({ success: true, data: organisation("Shree School") }),
      ),
      http.patch(`${API}/api/v1/organisations/:id`, async ({ request }) => {
        body = (await request.json()) as { name?: string };
        return HttpResponse.json({
          success: true,
          data: organisation("Shree School"),
        });
      }),
    );
    renderSchools(<OrganisationScreen organisationId={ORG_ID} />);
    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "Shree Secondary" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Save" })[0]!);
    await waitFor(() => expect(body).toMatchObject({ name: "Shree Secondary" }));
  });

  it("does not request an invalid school id", async () => {
    let called = false;
    server.use(
      http.get(`${API}/api/v1/organisations/:id`, () => {
        called = true;
        return HttpResponse.json({ success: true, data: organisation("Shree School") });
      }),
    );
    renderSchools(<OrganisationScreen organisationId="not-an-id" />);
    expect(await screen.findByRole("heading", { name: "Nothing here yet" })).toBeTruthy();
    expect(called).toBe(false);
  });
});
