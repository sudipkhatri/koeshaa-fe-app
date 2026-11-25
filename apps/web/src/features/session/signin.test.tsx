import { fireEvent, render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/lib/locale";
import { API, server } from "@/test/server";

import { SignInScreen } from "./SignInScreen";

function renderSignIn(onSignedIn: () => void = () => undefined) {
  return render(
    <LocaleProvider>
      <SignInScreen onSignedIn={onSignedIn} />
    </LocaleProvider>,
  );
}

describe("staff sign in", () => {
  it("sends the normalised email and signs in when tokens come back", async () => {
    let identifier = "";
    server.use(
      http.post(`${API}/api/v1/auth/sign-in`, async ({ request }) => {
        const body = (await request.json()) as { identifier: string; device_id: string };
        identifier = body.identifier;
        expect(body.device_id.length).toBeGreaterThanOrEqual(16);
        return HttpResponse.json({
          success: true,
          data: { tokens: { access_token: "access-1", expires_in: 900 } },
        });
      }),
    );
    const signedIn = viSignedIn();
    renderSignIn(signedIn.done);

    fireEvent.change(screen.getByLabelText("Phone, email or username"), {
      target: { value: "su" },
    });
    expect(screen.queryByText("Username")).toBeNull();
    fireEvent.change(screen.getByLabelText("Phone, email or username"), {
      target: { value: "Admin@Keoshaa.test" },
    });
    const password = screen.getByLabelText("Password");
    expect(password.className).not.toContain("border-border");
    expect(password.parentElement?.className).toContain("border-border");
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "keoshaa123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeTruthy();
    expect(document.querySelector("main")?.className).toContain("min-h-dvh");
    await signedIn.settled;
    expect(identifier).toBe("admin@keoshaa.test");
  });

  it("asks for a code when the server returns a challenge, and keeps the password off the next step", async () => {
    server.use(
      http.post(`${API}/api/v1/auth/sign-in`, () =>
        HttpResponse.json({
          success: true,
          data: {
            challenge: {
              challenge: "challenge-1",
              step: "code",
              expires_at: "2026-01-01T00:10:00Z",
            },
          },
        }),
      ),
    );
    renderSignIn();
    fireEvent.change(screen.getByLabelText("Phone, email or username"), {
      target: { value: "admin@keoshaa.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "keoshaa123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByLabelText("Code")).toBeTruthy();
    expect(screen.queryByLabelText("Password")).toBeNull();
  });

  it("shows the authenticator QR code from the setup link", async () => {
    const secret = "OUJ57SM5TS7HWKHZQ3CJ2QSXYX2DMKY2";
    server.use(
      http.post(`${API}/api/v1/auth/sign-in`, () =>
        HttpResponse.json({
          success: true,
          data: {
            challenge: {
              challenge: "challenge-mfa",
              step: "mfa_setup",
              expires_at: "2026-01-01T00:10:00Z",
              authenticator_secret: secret,
              authenticator_uri: `otpauth://totp/Keoshaa:Sudip?secret=${secret}&issuer=Keoshaa`,
            },
          },
        }),
      ),
    );
    renderSignIn();
    fireEvent.change(screen.getByLabelText("Phone, email or username"), {
      target: { value: "sudip.khatri@koeshaa.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "keoshaa123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("img", { name: "Authenticator QR code" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Set up an authenticator" })).toBeTruthy();
    expect(screen.getByText("OUJ5 7SM5 TS7H WKHZ Q3CJ 2QSX YX2D MKY2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Verify and turn on" })).toBeTruthy();
  });

  it("shows recovery codes before opening the console", async () => {
    const signedIn = viSignedIn();
    server.use(
      http.post(`${API}/api/v1/auth/sign-in`, () =>
        HttpResponse.json({
          success: true,
          data: {
            challenge: {
              challenge: "challenge-mfa",
              step: "mfa_setup",
              expires_at: "2026-01-01T00:10:00Z",
              authenticator_secret: "OUJ57SM5TS7HWKHZQ3CJ2QSXYX2DMKY2",
              authenticator_uri:
                "otpauth://totp/Keoshaa:Sudip?secret=OUJ57SM5TS7HWKHZQ3CJ2QSXYX2DMKY2&issuer=Keoshaa",
            },
          },
        }),
      ),
      http.post(`${API}/api/v1/auth/sign-in/verify`, () =>
        HttpResponse.json({
          success: true,
          data: {
            tokens: {
              access_token: "access-1",
              expires_in: 900,
              recovery_codes: ["7FQ2-M41K", "B8XR-0TLP"],
            },
          },
        }),
      ),
    );
    renderSignIn(signedIn.done);
    fireEvent.change(screen.getByLabelText("Phone, email or username"), {
      target: { value: "sudip.khatri@koeshaa.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "keoshaa123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    fireEvent.change(await screen.findByLabelText("Code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and turn on" }));

    expect(await screen.findByRole("heading", { name: "Save your recovery codes" })).toBeTruthy();
    expect(screen.getByText("7FQ2-M41K")).toBeTruthy();
    expect(screen.getByText("B8XR-0TLP")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "I have saved these" }));
    await signedIn.settled;
  });

  it("keeps what was typed when the network fails", async () => {
    server.use(http.post(`${API}/api/v1/auth/sign-in`, () => HttpResponse.error()));
    renderSignIn();
    fireEvent.change(screen.getByLabelText("Phone, email or username"), {
      target: { value: "admin@keoshaa.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "keoshaa123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("button", { name: "No connection" })).toBeTruthy();
    expect(screen.getByLabelText("Phone, email or username")).toHaveProperty(
      "value",
      "admin@keoshaa.test",
    );
  });

  it("resets the password with a code and returns to sign in", async () => {
    let resetBody: { identifier: string; code: string; password: string } | null = null;
    server.use(
      http.post(`${API}/api/v1/auth/codes`, async ({ request }) => {
        const body = (await request.json()) as { purpose: string; identifier: string };
        expect(body.purpose).toBe("reset");
        expect(body.identifier).toBe("admin@keoshaa.test");
        return HttpResponse.json({
          success: true,
          data: { sent_to: "a***@keoshaa.test", expires_in: 600 },
        });
      }),
      http.post(`${API}/api/v1/auth/password/reset`, async ({ request }) => {
        resetBody = (await request.json()) as {
          identifier: string;
          code: string;
          password: string;
        };
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderSignIn();
    fireEvent.change(screen.getByLabelText("Phone, email or username"), {
      target: { value: "Admin@Keoshaa.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));

    expect(await screen.findByRole("heading", { level: 2, name: "Forgot password" })).toBeTruthy();
    expect(screen.getByLabelText("Phone, email or username")).toHaveProperty(
      "value",
      "Admin@Keoshaa.test",
    );
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));

    expect(await screen.findByText("We sent a code to a***@keoshaa.test")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByRole("heading", { level: 2, name: "New password" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "newpass99" } });
    fireEvent.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByRole("heading", { level: 2, name: "Password changed" })).toBeTruthy();
    expect(resetBody).toEqual({
      identifier: "admin@keoshaa.test",
      code: "123456",
      password: "newpass99",
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { level: 2, name: "Welcome back" })).toBeTruthy();
    expect(screen.getByLabelText("Phone, email or username")).toHaveProperty(
      "value",
      "Admin@Keoshaa.test",
    );
  });

  it("keeps the identifier when sending a reset code fails offline", async () => {
    server.use(http.post(`${API}/api/v1/auth/codes`, () => HttpResponse.error()));
    renderSignIn();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(await screen.findByLabelText("Phone, email or username"), {
      target: { value: "admin@keoshaa.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));

    expect(await screen.findByRole("button", { name: "No connection" })).toBeTruthy();
    expect(screen.getByLabelText("Phone, email or username")).toHaveProperty(
      "value",
      "admin@keoshaa.test",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Forgot password" })).toBeTruthy();
  });

  it("does not advance when the reset code is not six digits", async () => {
    server.use(
      http.post(`${API}/api/v1/auth/codes`, () =>
        HttpResponse.json({
          success: true,
          data: { sent_to: "a***@keoshaa.test", expires_in: 600 },
        }),
      ),
    );
    renderSignIn();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(await screen.findByLabelText("Phone, email or username"), {
      target: { value: "admin@keoshaa.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    fireEvent.change(await screen.findByLabelText("Code"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByText("Enter the 6 digits.")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "New password" })).toBeNull();
  });
});

function viSignedIn() {
  let done: () => void = () => undefined;
  const settled = new Promise<void>((resolve) => {
    done = resolve;
  });
  return { done, settled };
}
