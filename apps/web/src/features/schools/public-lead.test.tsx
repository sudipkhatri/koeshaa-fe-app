import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/lib/locale";
import { API, server } from "@/test/server";

import { PublicLeadScreen } from "./PublicLeadScreen";

function renderLead(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <LocaleProvider>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </LocaleProvider>,
  );
}

describe("public school enquiry", () => {
  it("sends a normalised phone and shows the reference", async () => {
    let phone = "";
    server.use(
      http.post(`${API}/api/v1/public/school-leads`, async ({ request }) => {
        phone = ((await request.json()) as { phone: string }).phone;
        return HttpResponse.json({
          success: true,
          data: { id: "01J9Z8Y7X6W5V4T3S2R1Q0P9N8", status: "new" },
        });
      }),
    );
    renderLead(<PublicLeadScreen />);
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Sita Rai" } });
    fireEvent.change(screen.getByLabelText("School"), { target: { value: "Shree School" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9841234567" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const receipt = await screen.findByRole("status");
    expect(receipt.textContent).toContain("We have your enquiry.");
    expect(receipt.textContent).toContain(
      "Reference 01J9Z8Y7X6W5V4T3S2R1Q0P9N8. Keep it for when we call.",
    );
    expect(phone).toBe("+9779841234567");
  });

  it("keeps the school name when the network fails", async () => {
    server.use(http.post(`${API}/api/v1/public/school-leads`, () => HttpResponse.error()));
    renderLead(<PublicLeadScreen />);
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Sita Rai" } });
    fireEvent.change(screen.getByLabelText("School"), { target: { value: "Shree School" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9841234567" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("button", { name: "No connection" })).toBeTruthy();
    expect((screen.getByLabelText("School") as HTMLInputElement).value).toBe("Shree School");
  });
});
