import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Text } from "react-native";

import { useSession } from "@/features/session";
import type { AccountRole } from "@/features/session";
import { API, errorBody, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";
import { server } from "@/test/server";

import { CodeScreen } from "./CodeScreen";
import { ConsentsScreen } from "./ConsentsScreen";
import { NewPasswordScreen } from "./NewPasswordScreen";
import { RecoveryScreen } from "./RecoveryScreen";
import { SignupPasswordScreen } from "./SignupPasswordScreen";
import { WhoScreen } from "./WhoScreen";

/** Seeds the in-memory sign-up draft once. The session object is a new value every render. */
function WithAccount({
  children,
  role = "student",
  identifier = "9812345678",
}: {
  children: ReactNode;
  role?: AccountRole;
  identifier?: string;
}) {
  const session = useSession();
  const [ready, setReady] = useState(false);
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    session.updateSignup({
      role,
      name: "Sita",
      contact: identifier,
      password: "long-enough-1",
      day: "2",
      month: "3",
      year: "2012",
    });
    session.setFlow({ identifier, code: "123456" });
    setReady(true);
  }, [identifier, role, session]);
  return ready ? children : null;
}

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "0";
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "1";
  server.close();
});

const core = () => testCore(memoryTokenStore());

describe("sign-up code step", () => {
  it("keeps the code in memory and moves on to the password", async () => {
    await renderWithProviders(
      <CodeScreen to="98••••21" toParent={false} next="signup" />,
      undefined,
      core(),
    );
    await fireEvent.changeText(screen.getByLabelText("Digit 1"), "123456");
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/signup-password"),
    );
  });
});

describe("sign-up password step", () => {
  it("needs 8 characters, then continues to the consents", async () => {
    await renderWithProviders(<SignupPasswordScreen />, undefined, core());
    const next = screen.getByRole("button", { name: "Next" });
    expect(next.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Password"), "long-enough-1");
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    expect(routerMock.push).toHaveBeenCalledWith("/onboarding/consents");
  });
});

describe("consents and registration", () => {
  const agree = async () => {
    await fireEvent.press(await screen.findByRole("checkbox", { name: /Terms of Use/ }));
    await fireEvent.press(screen.getByRole("checkbox", { name: /Privacy Policy/ }));
    await fireEvent.press(screen.getByRole("button", { name: "Agree and create account" }));
  };

  it("cannot continue until both consents are ticked", async () => {
    await renderWithProviders(<ConsentsScreen />, undefined, core());
    await fireEvent.press(screen.getByRole("checkbox", { name: /Terms of Use/ }));
    expect(
      screen.getByRole("button", { name: "Agree and create account" }).props.accessibilityState
        .disabled,
    ).toBe(true);
  });

  it("registers with the consent versions and opens the success step", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.get(`${API}/api/v1/site-pages/:slug`, () =>
        HttpResponse.json(errorBody("PAGE_NOT_FOUND"), { status: 404 }),
      ),
      http.post(`${API}/api/v1/auth/register/student`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: tokensBody("a1", "r1").data, meta: {} });
      }),
    );
    await renderWithProviders(
      <WithAccount>
        <ConsentsScreen />
      </WithAccount>,
      undefined,
      core(),
    );
    await agree();
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/success"));
    expect(body.consents).toEqual({ terms_version: "2026-10", privacy_version: "2026-10" });
    expect(body.identifier).toBe("+9779812345678");
    expect(body.name).toBe("Sita");
  });

  it("registers a parent without a birthday", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.get(`${API}/api/v1/site-pages/:slug`, () =>
        HttpResponse.json(errorBody("PAGE_NOT_FOUND"), { status: 404 }),
      ),
      http.post(`${API}/api/v1/auth/register/parent`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          success: true,
          data: { tokens: tokensBody("a1", "r1", "Sita").data, children: [] },
          meta: {},
        });
      }),
    );
    await renderWithProviders(
      <WithAccount role="parent">
        <ConsentsScreen />
      </WithAccount>,
      undefined,
      core(),
    );
    await agree();
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/success"));
    expect(body.identifier).toBe("+9779812345678");
    expect(body).not.toHaveProperty("date_of_birth");
  });

  it("shows an expired code with a way to get a new one", async () => {
    server.use(
      http.get(`${API}/api/v1/site-pages/:slug`, () =>
        HttpResponse.json(errorBody("PAGE_NOT_FOUND"), { status: 404 }),
      ),
      http.post(`${API}/api/v1/auth/register/student`, () =>
        HttpResponse.json(errorBody("INVALID_CODE"), { status: 400 }),
      ),
    );
    await renderWithProviders(<ConsentsScreen />, undefined, core());
    await agree();
    await fireEvent.press(await screen.findByRole("button", { name: /new code/i }));
    expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/signup-contact");
  });
});

describe("new password (reset)", () => {
  it("resets and opens the confirmation", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${API}/api/v1/auth/password/reset`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await renderWithProviders(
      <WithAccount identifier="sita">
        <NewPasswordScreen />
      </WithAccount>,
      undefined,
      core(),
    );
    await fireEvent.changeText(await screen.findByLabelText("New password"), "brand-new-pass");
    await fireEvent.press(screen.getByRole("button", { name: "Save password" }));
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/password-changed"),
    );
    expect(body).toMatchObject({ identifier: "sita", code: "123456" });
  });

  it("offers a new code when the reset code is wrong", async () => {
    server.use(
      http.post(`${API}/api/v1/auth/password/reset`, () =>
        HttpResponse.json(errorBody("INVALID_CODE"), { status: 400 }),
      ),
    );
    await renderWithProviders(
      <WithAccount identifier="sita">
        <NewPasswordScreen />
      </WithAccount>,
      undefined,
      core(),
    );
    await fireEvent.changeText(await screen.findByLabelText("New password"), "brand-new-pass");
    await fireEvent.press(screen.getByRole("button", { name: "Save password" }));
    await fireEvent.press(await screen.findByRole("button", { name: /new code/i }));
    expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/forgot");
  });
});

describe("who the account is for", () => {
  it("remembers a parent choice", async () => {
    function Role() {
      const role = useSession().signup.role;
      return <Text accessibilityLabel={`role ${role}`}>{role}</Text>;
    }
    await renderWithProviders(
      <>
        <WhoScreen />
        <Role />
      </>,
      undefined,
      core(),
    );
    await fireEvent.press(screen.getByRole("radio", { name: /I'm a parent/ }));
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText("role parent")).toBeTruthy();
    expect(routerMock.push).toHaveBeenCalledWith("/onboarding/welcome");
  });
});

describe("account recovery", () => {
  it("asks support to call back and shows the reference", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${API}/api/v1/auth/recovery-requests`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true, data: { reference: "K-42" }, meta: {} });
      }),
    );
    await renderWithProviders(<RecoveryScreen />, undefined, core());
    await fireEvent.changeText(screen.getByLabelText("Your name"), "Sita Rai");
    await fireEvent.changeText(screen.getByLabelText("Phone to call"), "9812345678");
    await fireEvent.press(screen.getByRole("button", { name: "Request a call" }));
    expect(await screen.findByText("K-42")).toBeTruthy();
    expect(body).toMatchObject({ name: "Sita Rai", callback_phone: "+9779812345678" });
  });
});
