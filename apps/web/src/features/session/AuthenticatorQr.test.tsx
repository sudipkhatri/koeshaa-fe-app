import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LocaleProvider } from "@/lib/locale";

import { AuthenticatorKey, AuthenticatorQr } from "./AuthenticatorQr";

const SECRET = "OUJ57SM5TS7HWKHZQ3CJ2QSXYX2DMKY2";
const URI = `otpauth://totp/Keoshaa:Sudip?secret=${SECRET}&issuer=Keoshaa`;

describe("authenticator QR", () => {
  it("draws a QR code for an authenticator link", () => {
    render(<AuthenticatorQr uri={URI} label="Authenticator QR code" />);
    expect(
      screen.getByRole("img", { name: "Authenticator QR code" }).querySelector("path"),
    ).toBeTruthy();
  });

  it("does not draw a QR code for any other link", () => {
    render(<AuthenticatorQr uri="https://evil.example/secret" label="Authenticator QR code" />);
    expect(screen.queryByRole("img", { name: "Authenticator QR code" })).toBeNull();
  });

  it("shows the key in groups beside the QR code", () => {
    render(
      <LocaleProvider>
        <AuthenticatorKey secret={SECRET} uri={URI} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("img", { name: "Authenticator QR code" })).toBeTruthy();
    expect(screen.getByText("OUJ5 7SM5 TS7H WKHZ Q3CJ 2QSX YX2D MKY2")).toBeTruthy();
  });
});
