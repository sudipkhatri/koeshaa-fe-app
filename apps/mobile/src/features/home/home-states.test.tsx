import { onlineManager } from "@tanstack/react-query";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { delay, http, HttpResponse } from "msw";

import { ContentScreen } from "@/features/learn/ContentScreen";
import { LearnScreen } from "@/features/learn/LearnScreen";
import { API, errorBody, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { MeScreen } from "@/features/me/MeScreen";
import { SearchScreen } from "@/features/search/SearchScreen";

import { HomeScreen } from "./HomeScreen";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

const mockNetwork = { online: true };
jest.mock("expo-network", () => ({
  getNetworkStateAsync: async () => ({
    isConnected: mockNetwork.online,
    isInternetReachable: mockNetwork.online,
  }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}));
const goOffline = async () => {
  mockNetwork.online = false;
  await act(async () => onlineManager.setOnline(false));
};

const profile = () =>
  http.get(`${API}/api/v1/me`, () =>
    HttpResponse.json({
      success: true,
      data: {
        user: tokensBody("a", "r").data.user,
        second_device_notice: false,
        missing_consents: [],
      },
      meta: {},
    }),
  );

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "0";
  server.listen();
});
beforeEach(() =>
  server.use(
    http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(tokensBody("a2", "r2"))),
    profile(),
    http.get(`${API}/api/v1/catalog/grade-levels`, () =>
      HttpResponse.json({ success: true, data: [{ id: "g7", code: "c7" }], meta: {} }),
    ),
    http.get(`${API}/api/v1/me/enrollments`, () =>
      HttpResponse.json({
        success: true,
        data: {
          current: [
            {
              id: "e1",
              state: "confirmed",
              grade_level_id: "g7",
              stream_id: null,
              subjects: [{ code: "mathematics", name: "Mathematics", kind: "compulsory" }],
            },
          ],
        },
        meta: {},
      }),
    ),
  ),
);
afterEach(() => {
  mockNetwork.online = true;
  onlineManager.setOnline(true);
  server.resetHandlers();
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

const failEnrollments = () =>
  server.use(
    http.get(`${API}/api/v1/catalog/grade-levels`, () =>
      HttpResponse.json({ success: true, data: [], meta: {} }),
    ),
    http.get(`${API}/api/v1/me/enrollments`, () =>
      HttpResponse.json(errorBody("BOOM"), { status: 500 }),
    ),
  );

describe("Learn states", () => {
  it("shows the loading skeleton first", async () => {
    server.use(http.get(`${API}/api/v1/me/enrollments`, () => delay("infinite")));
    await renderSignedIn(<LearnScreen />);
    expect(screen.getByLabelText("Loading")).toBeTruthy();
  });

  it("shows an error with retry when the server fails", async () => {
    failEnrollments();
    await renderSignedIn(<LearnScreen />);
    expect(await screen.findByText("Oops, that was on us")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("shows No connection with retry while offline and recovers", async () => {
    await goOffline();
    await renderSignedIn(<LearnScreen />);
    expect(await screen.findByText("No connection")).toBeTruthy();
    mockNetwork.online = true;
    await act(async () => onlineManager.setOnline(true));
    expect(await screen.findByText("Mathematics")).toBeTruthy();
  });
});

describe("Home states", () => {
  it("shows No connection with retry while offline", async () => {
    await goOffline();
    await renderSignedIn(<HomeScreen />);
    expect(await screen.findByText("No connection")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
  });

  it("shows an error when the server fails", async () => {
    failEnrollments();
    await renderSignedIn(<HomeScreen />);
    expect(await screen.findByText("Oops, that was on us")).toBeTruthy();
  });

  it("never shows demo streak or daily goal to a real student", async () => {
    await renderSignedIn(<HomeScreen />);
    expect(await screen.findByText("Namaste, Aarav")).toBeTruthy();
    expect(screen.queryByText(/day streak/i)).toBeNull();
  });
});

describe("Real students never see demo data", () => {
  it("search says it is coming soon", async () => {
    await renderSignedIn(<SearchScreen />);
    expect(await screen.findByText("Search is coming soon")).toBeTruthy();
    expect(screen.queryByText("Recent searches")).toBeNull();
  });

  it("lessons say they are coming soon", async () => {
    await renderSignedIn(<ContentScreen contentRef="maths:0:0" />);
    expect(await screen.findByText("Lessons are coming soon")).toBeTruthy();
  });

  it("the Me screen hides the demo stats", async () => {
    await renderSignedIn(<MeScreen />);
    expect(await screen.findByText("Aarav")).toBeTruthy();
    expect(screen.queryByText("Chapters done")).toBeNull();
    expect(screen.queryByText("Minutes")).toBeNull();
  });

  it("Me shows No connection while offline", async () => {
    await goOffline();
    await renderSignedIn(<MeScreen />);
    expect(await screen.findByText("No connection")).toBeTruthy();
  });
});
