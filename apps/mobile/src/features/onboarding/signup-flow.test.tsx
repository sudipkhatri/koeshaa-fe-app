import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import { API, errorBody, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";
import { server } from "@/test/server";

import { CodeScreen } from "./CodeScreen";
import { ConsentsScreen } from "./ConsentsScreen";
import { NewPasswordScreen } from "./NewPasswordScreen";
import { SignupPasswordScreen } from "./SignupPasswordScreen";

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
    await fireEvent.press(screen.getByRole("checkbox", { name: /Terms of Use/ }));
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
    await renderWithProviders(<ConsentsScreen />, undefined, core());
    await agree();
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/success"));
    expect(body.consents).toEqual({ terms_version: "2026-10", privacy_version: "2026-10" });
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
    server.use(
      http.post(`${API}/api/v1/auth/password/reset`, () => new HttpResponse(null, { status: 204 })),
    );
    await renderWithProviders(<NewPasswordScreen />, undefined, core());
    await fireEvent.changeText(screen.getByLabelText("New password"), "brand-new-pass");
    await fireEvent.press(screen.getByRole("button", { name: "Save password" }));
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/password-changed"),
    );
  });

  it("offers a new code when the reset code is wrong", async () => {
    server.use(
      http.post(`${API}/api/v1/auth/password/reset`, () =>
        HttpResponse.json(errorBody("INVALID_CODE"), { status: 400 }),
      ),
    );
    await renderWithProviders(<NewPasswordScreen />, undefined, core());
    await fireEvent.changeText(screen.getByLabelText("New password"), "brand-new-pass");
    await fireEvent.press(screen.getByRole("button", { name: "Save password" }));
    await fireEvent.press(await screen.findByRole("button", { name: /new code/i }));
    expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/forgot");
  });
});
