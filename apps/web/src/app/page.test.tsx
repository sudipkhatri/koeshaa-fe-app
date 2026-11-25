import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("home page", () => {
  it("shows the promise, the school enquiry and staff sign-in", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Ten questions a day.");
    expect(screen.getByText("23-day streak — keep it going")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "For schools" })[0]?.getAttribute("href")).toBe(
      "/schools",
    );
    expect(screen.getAllByRole("link", { name: "Sign in" })[0]?.getAttribute("href")).toBe(
      "/admin",
    );
  });

  it("opens the small-screen menu", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("button", { name: "Close menu" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(screen.getAllByRole("link", { name: "How it works" }).length).toBeGreaterThan(1);
  });

  it("stacks the footer links on their own rows", () => {
    render(<Home />);
    const schools = screen.getByRole("navigation", { name: "For schools" });
    expect(within(schools).getByRole("list").className).toContain("flex-col");
    expect(
      within(schools)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Talk to us", "School sign in", "Pricing for schools"]);
    expect(within(schools).getByRole("link", { name: "School sign in" }).getAttribute("href")).toBe(
      "/school",
    );
    expect(
      within(screen.getByRole("navigation", { name: "Learn" })).getAllByRole("listitem"),
    ).toHaveLength(4);
  });

  it("switches the promise to Nepali", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "नेपाली" }));
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("दिनको दस प्रश्न।");
  });
});
