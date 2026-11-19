import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import { API, errorBody, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { DevicesScreen } from "./DevicesScreen";

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
afterEach(() => server.resetHandlers());
afterAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "1";
  server.close();
});

const now = new Date().toISOString();
const device = (id: string, name: string, current: boolean) => ({
  id,
  name,
  first_seen_at: now,
  last_seen_at: now,
  current,
});

async function renderSignedIn() {
  const store = memoryTokenStore("refresh-1");
  await store.setTokens({ accessToken: "a1", expiresInSeconds: 900 });
  await renderWithProviders(<DevicesScreen />, undefined, testCore(store));
}

describe("Devices (real API)", () => {
  it("shows the devices, marking this one", async () => {
    server.use(
      http.get(`${API}/api/v1/me/devices`, () =>
        HttpResponse.json({
          success: true,
          data: [device("d1", "Redmi 12C", true), device("d2", "Galaxy A14", false)],
          meta: {},
        }),
      ),
    );
    await renderSignedIn();
    expect(await screen.findByText("Redmi 12C")).toBeTruthy();
    expect(screen.getByText("Galaxy A14")).toBeTruthy();
    expect(screen.getByText("This device")).toBeTruthy();
  });

  it("signs another device out and refreshes the list", async () => {
    let devices = [device("d1", "Redmi 12C", true), device("d2", "Galaxy A14", false)];
    server.use(
      http.get(`${API}/api/v1/me/devices`, () =>
        HttpResponse.json({ success: true, data: devices, meta: {} }),
      ),
      http.delete(`${API}/api/v1/me/devices/d2`, () => {
        devices = devices.slice(0, 1);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await renderSignedIn();
    await fireEvent.press(await screen.findByRole("button", { name: "Sign out Galaxy A14" }));
    await fireEvent.press(screen.getByRole("button", { name: "Yes, sign it out" }));
    await waitFor(() => expect(screen.queryByText("Galaxy A14")).toBeNull());
  });

  it("shows an error state with a retry when the server fails", async () => {
    server.use(
      http.get(`${API}/api/v1/me/devices`, () =>
        HttpResponse.json(errorBody("INTERNAL_ERROR"), { status: 500 }),
      ),
    );
    await renderSignedIn();
    expect(await screen.findByText("Oops, that was on us")).toBeTruthy();
  });

  it("shows No connection when the network is down", async () => {
    server.use(http.get(`${API}/api/v1/me/devices`, () => HttpResponse.error()));
    await renderSignedIn();
    expect(await screen.findByText("No connection")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
