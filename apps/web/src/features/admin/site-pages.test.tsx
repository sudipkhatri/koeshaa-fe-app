import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { API, server } from "@/test/server";

import { LEAD_ID, renderAdmin } from "./admin-test-utils";
import { SitePageScreen } from "./SitePageScreen";

function page(slug: string, locale: string, version: string, title: string) {
  return HttpResponse.json({
    success: true,
    data: {
      id: LEAD_ID,
      slug,
      locale,
      version,
      title,
      body: "The current text.",
      published_at: "2026-01-02T04:15:00Z",
    },
  });
}

describe("admin site pages", () => {
  it("shows each page's version and fills the form from the published text", async () => {
    server.use(
      http.get(`${API}/api/v1/site-pages/:slug`, ({ params, request }) => {
        const locale = new URL(request.url).searchParams.get("locale");
        if (params.slug === "terms" && locale === "en")
          return page("terms", "en", "2083.4", "Terms of use");
        return HttpResponse.json({ error: { code: "NOT_FOUND", message: "no" } }, { status: 404 });
      }),
    );
    renderAdmin(<SitePageScreen />);
    expect(await screen.findByDisplayValue("Terms of use")).toBeTruthy();
    expect(screen.getByDisplayValue("The current text.")).toBeTruthy();
    expect(screen.getByDisplayValue("2083.4")).toBeTruthy();
    const list = within(screen.getByRole("region", { name: "Pages" }));
    expect(list.getByRole("button", { name: /Terms/ }).textContent).toContain("2083.4");
    expect(list.getByRole("button", { name: /Privacy/ }).textContent).toContain("—");
    expect(screen.getByText(/Last published/)).toBeTruthy();
    const headerPreview = screen
      .getAllByRole("button", { name: "Preview" })
      .find((button) => button.hasAttribute("disabled"));
    expect(headerPreview).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save draft" })).toHaveProperty("disabled", true);
    expect(screen.getAllByText("API to be added").length).toBeGreaterThan(0);
  });

  it("does not treat an English fallback as the Nepali page", async () => {
    let nepali = 0;
    server.use(
      http.get(`${API}/api/v1/site-pages/:slug`, ({ request }) => {
        const locale = new URL(request.url).searchParams.get("locale");
        if (locale === "ne") {
          nepali += 1;
          return page("terms", "en", "2083.4", "Terms of use");
        }
        return HttpResponse.json({ error: { code: "NOT_FOUND", message: "no" } }, { status: 404 });
      }),
    );
    renderAdmin(<SitePageScreen />);
    expect(await screen.findByText("No published version yet.")).toBeTruthy();
    fireEvent.click(
      within(screen.getByRole("group", { name: "Page language" })).getByRole("button", {
        name: "नेपाली",
      }),
    );
    await waitFor(() => expect(nepali).toBe(3));
    expect(await screen.findByText("No published version yet.")).toBeTruthy();
    expect(screen.queryByDisplayValue("Terms of use")).toBeNull();
  });

  it("asks for the page in the language that was chosen", async () => {
    const locales: string[] = [];
    server.use(
      http.get(`${API}/api/v1/site-pages/:slug`, ({ request }) => {
        locales.push(new URL(request.url).searchParams.get("locale") ?? "");
        return HttpResponse.json({ error: { code: "NOT_FOUND", message: "no" } }, { status: 404 });
      }),
    );
    renderAdmin(<SitePageScreen />);
    expect(await screen.findByText("No published version yet.")).toBeTruthy();
    fireEvent.click(
      within(screen.getByRole("group", { name: "Page language" })).getByRole("button", {
        name: "नेपाली",
      }),
    );
    await waitFor(() => expect(locales).toContain("ne"));
  });

  it("formats the body and previews it as text", async () => {
    server.use(
      http.get(`${API}/api/v1/site-pages/:slug`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "no" } }, { status: 404 }),
      ),
    );
    renderAdmin(<SitePageScreen />);
    const body = await screen.findByLabelText("Body — Markdown");
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(body).toHaveProperty("value", "**bold**");
    fireEvent.change(body, {
      target: { value: "# Terms\n\nA [site](https://keoshaa.com) and [bad](javascript:alert(1))." },
    });
    fireEvent.click(
      within(screen.getByRole("group", { name: "Editor" })).getByRole("button", {
        name: "Preview",
      }),
    );
    expect(screen.getByRole("heading", { name: "Terms" })).toBeTruthy();
    const link = screen.getByRole("link", { name: "site" });
    expect(link.getAttribute("href")).toBe("https://keoshaa.com/");
    expect(screen.queryByRole("link", { name: "bad" })).toBeNull();
    expect(screen.getByText(/javascript:alert/)).toBeTruthy();
  });

  it("says you cannot do this when the page is forbidden", async () => {
    server.use(
      http.get(`${API}/api/v1/site-pages/:slug`, () =>
        HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 }),
      ),
    );
    renderAdmin(<SitePageScreen />);
    expect(await screen.findByRole("heading", { name: "You cannot do this." })).toBeTruthy();
    expect(screen.getByLabelText("Title")).toBeTruthy();
  });

  it("says there is no connection when the current page cannot load", async () => {
    server.use(http.get(`${API}/api/v1/site-pages/:slug`, () => HttpResponse.error()));
    renderAdmin(<SitePageScreen />);
    expect(await screen.findByRole("heading", { name: "No connection" })).toBeTruthy();
    expect(screen.getByLabelText("Title")).toBeTruthy();
  });
});
