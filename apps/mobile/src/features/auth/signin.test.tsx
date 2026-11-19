import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import { SignInScreen } from "@/features/onboarding/SignInScreen";
import { API, errorBody, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";
import { server } from "@/test/server";

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

async function submit(store = memoryTokenStore()) {
  await renderWithProviders(<SignInScreen />, undefined, testCore(store));
  await fireEvent.changeText(screen.getByLabelText("Phone, email or username"), "aarav");
  await fireEvent.changeText(screen.getByLabelText("Password"), "correct-horse");
  await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
  return store;
}

describe("sign in against the API", () => {
  it("signs in, stores the refresh token and opens Home", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${API}/api/v1/auth/sign-in`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          success: true,
          data: { tokens: tokensBody("a1", "r1").data, challenge: null },
          meta: {},
        });
      }),
    );
    const store = await submit();
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/home"));
    expect(await store.getRefreshToken()).toBe("r1");
    expect(store.getAccessToken()).toBe("a1");
    expect(body).toMatchObject({ identifier: "aarav", device_id: "device-1" });
  });

  it("goes to the code step on a new device", async () => {
    server.use(
      http.post(`${API}/api/v1/auth/sign-in`, () =>
        HttpResponse.json({
          success: true,
          data: {
            tokens: null,
            challenge: {
              challenge: "c1",
              step: "code",
              sent_to: "+97798•••••67",
              expires_at: "2026-01-01T00:00:00Z",
            },
          },
          meta: {},
        }),
      ),
    );
    await submit();
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith({
        pathname: "/onboarding/code",
        params: { to: "+97798•••••67", child: "1", next: "signed-in" },
      }),
    );
  });

  it("shows a friendly message for a wrong password and keeps what was typed", async () => {
    server.use(
      http.post(`${API}/api/v1/auth/sign-in`, () =>
        HttpResponse.json(errorBody("INVALID_CREDENTIALS"), { status: 401 }),
      ),
    );
    await submit();
    expect(await screen.findByText(/That did not match/)).toBeTruthy();
    expect(screen.getByLabelText("Phone, email or username").props.value).toBe("aarav");
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("shows the pause screen with a countdown when the account is locked", async () => {
    server.use(
      http.post(`${API}/api/v1/auth/sign-in`, () =>
        HttpResponse.json(errorBody("SIGN_IN_LOCKED"), {
          status: 429,
          headers: { "Retry-After": "900" },
        }),
      ),
    );
    await submit();
    expect(await screen.findByText("Let's take a short break")).toBeTruthy();
    expect(screen.getByText(/^15:0[01]$/)).toBeTruthy();
  });

  it("says there is no connection and keeps the form", async () => {
    server.use(http.post(`${API}/api/v1/auth/sign-in`, () => HttpResponse.error()));
    await submit();
    expect(await screen.findByText(/No connection/)).toBeTruthy();
    expect(screen.getByLabelText("Password").props.value).toBe("correct-horse");
  });
});
