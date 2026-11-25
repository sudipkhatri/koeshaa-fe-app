import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import { API, errorBody, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { AlertsScreen } from "./AlertsScreen";

jest.mock("expo-router", () => ({
  router: jest.requireActual("@/test/router-mock").routerMock,
}));

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "0";
  server.listen();
});
beforeEach(() =>
  server.use(
    http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(tokensBody("a2", "r2"))),
    http.get(`${API}/api/v1/me`, () =>
      HttpResponse.json({
        success: true,
        data: {
          user: tokensBody("a", "r").data.user,
          second_device_notice: false,
          missing_consents: [],
          mfa_enabled: false,
        },
        meta: {},
      }),
    ),
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

const alertRow = (id: string, read = false) => ({
  id,
  kind: "subject_ready",
  title: `Title ${id}`,
  body: `Body ${id}`,
  url: null,
  data: {},
  read_at: read ? "2026-01-01T00:00:00Z" : null,
  created_at: "2026-01-02T00:00:00Z",
});

describe("Alerts", () => {
  it("lists titles from the server", async () => {
    server.use(
      http.get(`${API}/api/v1/notifications`, () =>
        HttpResponse.json({
          success: true,
          data: [alertRow("n1"), alertRow("n2", true)],
          meta: { pagination: { limit: 20, next_cursor: null, has_more: false } },
        }),
      ),
      http.get(`${API}/api/v1/notifications/unread-count`, () =>
        HttpResponse.json({ success: true, data: { unread: 1 }, meta: {} }),
      ),
    );
    await renderSignedIn(<AlertsScreen />);
    expect(await screen.findByText("Title n1")).toBeTruthy();
    expect(screen.getByText("Title n2")).toBeTruthy();
    expect(screen.getByText("Mark all read")).toBeTruthy();
  });

  it("marks one read when opened", async () => {
    const read = jest.fn();
    server.use(
      http.get(`${API}/api/v1/notifications`, () =>
        HttpResponse.json({
          success: true,
          data: [alertRow("n1")],
          meta: { pagination: { limit: 20, next_cursor: null, has_more: false } },
        }),
      ),
      http.post(`${API}/api/v1/notifications/n1/read`, () => {
        read();
        return HttpResponse.json({
          success: true,
          data: alertRow("n1", true),
          meta: {},
        });
      }),
    );
    await renderSignedIn(<AlertsScreen />);
    await fireEvent.press(await screen.findByText("Title n1"));
    await waitFor(() => expect(read).toHaveBeenCalled());
  });

  it("marks all read", async () => {
    const all = jest.fn();
    server.use(
      http.get(`${API}/api/v1/notifications`, () =>
        HttpResponse.json({
          success: true,
          data: [alertRow("n1")],
          meta: { pagination: { limit: 20, next_cursor: null, has_more: false } },
        }),
      ),
      http.post(`${API}/api/v1/notifications/read-all`, () => {
        all();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await renderSignedIn(<AlertsScreen />);
    await fireEvent.press(await screen.findByText("Mark all read"));
    await waitFor(() => expect(all).toHaveBeenCalled());
  });

  it("shows empty and error states", async () => {
    server.use(
      http.get(`${API}/api/v1/notifications`, () =>
        HttpResponse.json({
          success: true,
          data: [],
          meta: { pagination: { limit: 20, next_cursor: null, has_more: false } },
        }),
      ),
    );
    await renderSignedIn(<AlertsScreen />);
    expect(await screen.findByText("No alerts yet")).toBeTruthy();

    server.use(
      http.get(`${API}/api/v1/notifications`, () =>
        HttpResponse.json(errorBody("HTTP_500"), { status: 500 }),
      ),
    );
    await renderSignedIn(<AlertsScreen />);
    expect(await screen.findByText("Oops, that was on us")).toBeTruthy();
  });
});
