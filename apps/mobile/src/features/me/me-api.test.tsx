import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import { API, errorBody, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";
import { server } from "@/test/server";

import { ChangePasswordScreen } from "./ChangePasswordScreen";
import { CloseAccountScreen } from "./CloseAccountScreen";
import { MeScreen } from "./MeScreen";
import { ParentScreen } from "./ParentScreen";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "0";
  server.listen();
});
beforeEach(() =>
  server.use(
    http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(tokensBody("a2", "refresh-2"))),
  ),
);
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "1";
  server.close();
});

async function renderSignedIn(ui: React.ReactElement) {
  const store = memoryTokenStore("refresh-1");
  await store.setTokens({ accessToken: "a1", expiresInSeconds: 900 });
  await renderWithProviders(ui, undefined, testCore(store));
}

describe("Change password", () => {
  const fill = async (current: string, next: string, again: string) => {
    await fireEvent.changeText(screen.getByLabelText("Current password"), current);
    await fireEvent.changeText(screen.getByLabelText("New password"), next);
    await fireEvent.changeText(screen.getByLabelText("New password again"), again);
    await fireEvent.press(screen.getByRole("button", { name: "Change password" }));
  };

  it("does not send when the two new passwords differ", async () => {
    const sent = jest.fn();
    server.use(
      http.post(
        `${API}/api/v1/me/password`,
        () => sent() ?? new HttpResponse(null, { status: 204 }),
      ),
    );
    await renderSignedIn(<ChangePasswordScreen />);
    await fill("old-password", "new-password-1", "new-password-2");
    expect(await screen.findByText("The two passwords do not match.")).toBeTruthy();
    expect(sent).not.toHaveBeenCalled();
  });

  it("sends the change and goes back", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${API}/api/v1/me/password`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await renderSignedIn(<ChangePasswordScreen />);
    await fill("old-password", "new-password-1", "new-password-1");
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
    expect(body).toEqual({ current_password: "old-password", new_password: "new-password-1" });
  });

  it("shows the backend's refusal", async () => {
    server.use(
      http.post(`${API}/api/v1/me/password`, () =>
        HttpResponse.json(errorBody("INVALID_CREDENTIALS"), { status: 401 }),
      ),
    );
    await renderSignedIn(<ChangePasswordScreen />);
    await fill("wrong-password", "new-password-1", "new-password-1");
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(routerMock.back).not.toHaveBeenCalled();
  });
});

describe("Close account", () => {
  const press = () => fireEvent.press(screen.getByRole("button", { name: "Close my account" }));

  it("asks for the password before anything is sent", async () => {
    const sent = jest.fn();
    server.use(
      http.post(`${API}/api/v1/me/close`, () => sent() ?? new HttpResponse(null, { status: 204 })),
    );
    await renderSignedIn(<CloseAccountScreen />);
    await press();
    expect(await screen.findByText("Please enter your password to continue.")).toBeTruthy();
    expect(sent).not.toHaveBeenCalled();
  });

  it("shows the error and keeps the account when the password is wrong", async () => {
    server.use(
      http.post(`${API}/api/v1/me/close`, () =>
        HttpResponse.json(errorBody("INVALID_CREDENTIALS"), { status: 401 }),
      ),
    );
    await renderSignedIn(<CloseAccountScreen />);
    await fireEvent.changeText(
      screen.getByLabelText("Enter your password to confirm"),
      "nope-nope",
    );
    await press();
    expect(await screen.findByText(/That did not match/)).toBeTruthy();
    expect(screen.queryByText("Your account is closed")).toBeNull();
  });

  it("sends once however many times it is pressed, then shows the closed screen", async () => {
    let calls = 0;
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(`${API}/api/v1/me/close`, async () => {
        calls += 1;
        await gate;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await renderSignedIn(<CloseAccountScreen />);
    await fireEvent.changeText(
      screen.getByLabelText("Enter your password to confirm"),
      "right-password",
    );
    await press();
    await press();
    expect(calls).toBe(1);
    release();
    expect(await screen.findByText("Your account is closed")).toBeTruthy();
    expect(calls).toBe(1);
  });
});

describe("Parent invite", () => {
  it("rejects a short number locally", async () => {
    await renderSignedIn(<ParentScreen />);
    await fireEvent.changeText(screen.getByLabelText("Parent's phone number"), "123");
    await fireEvent.press(screen.getByRole("button", { name: "Send invite by SMS" }));
    expect(await screen.findByText("Please enter a 10 digit phone number.")).toBeTruthy();
  });

  it("sends the invite and confirms", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${API}/api/v1/me/guardian-invitations`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            success: true,
            data: {
              id: "inv-1",
              parent_id: null,
              student_id: "stu-1",
              relationship: "guardian",
              state: "pending",
              invited_phone: "+9779801234567",
              expires_at: null,
              accepted_at: null,
              created_by: "stu-1",
            },
            meta: {},
          },
          { status: 201 },
        );
      }),
    );
    await renderSignedIn(<ParentScreen />);
    await fireEvent.changeText(screen.getByLabelText("Parent's phone number"), "9801234567");
    await fireEvent.press(screen.getByRole("button", { name: "Send invite by SMS" }));
    expect(await screen.findByText("Invite sent!")).toBeTruthy();
    expect(body).toMatchObject({ relationship: "guardian" });
  });
});

describe("Sign out of all devices", () => {
  const meBody = {
    success: true,
    data: {
      user: tokensBody("a", "r").data.user,
      second_device_notice: false,
      missing_consents: [],
    },
    meta: {},
  };

  async function signOutEverywhere() {
    server.use(http.get(`${API}/api/v1/me`, () => HttpResponse.json(meBody)));
    server.use(
      http.get(`${API}/api/v1/me/devices`, () =>
        HttpResponse.json({ success: true, data: [], meta: {} }),
      ),
    );
    await renderSignedIn(<MeScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "Sign out" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Sign out of all devices" }));
  }

  it("confirms normally when the backend answers", async () => {
    server.use(
      http.post(
        `${API}/api/v1/auth/sign-out-everywhere`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    await signOutEverywhere();
    expect(await screen.findByText("Signed out. See you soon!")).toBeTruthy();
    expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/welcome");
  });

  it("signs out here anyway but warns that other devices may still be signed in", async () => {
    server.use(http.post(`${API}/api/v1/auth/sign-out-everywhere`, () => HttpResponse.error()));
    await signOutEverywhere();
    expect(await screen.findByText("Other devices may still be signed in.")).toBeTruthy();
    expect(routerMock.replace).toHaveBeenCalledWith("/onboarding/welcome");
  });
});
