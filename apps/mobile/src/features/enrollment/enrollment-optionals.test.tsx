import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import { EnrolConfirmScreen } from "@/features/onboarding/EnrolConfirmScreen";
import { PickOptionalsScreen } from "@/features/onboarding/PickOptionalsScreen";
import { API, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";
import { server } from "@/test/server";

jest.mock("expo-router", () => ({
  router: jest.requireActual("@/test/router-mock").routerMock,
  useLocalSearchParams: () => ({
    enrollmentId: "enr-1",
    grade: "11",
    stream: "science",
    deferred: "0",
    optionals: "o2",
  }),
}));

const pool = {
  pool_version_id: "pv1",
  grade_level_id: "g11",
  stream_id: "s1",
  optional_required: 2,
  compulsory: [
    {
      subject_id: "c1",
      code: "phy",
      name: "Physics",
      availability: "available",
      expected_on: null,
    },
  ],
  optional: [
    {
      subject_id: "o1",
      code: "bio",
      name: "Biology",
      availability: "coming_soon",
      expected_on: null,
    },
    {
      subject_id: "o2",
      code: "math",
      name: "Mathematics",
      availability: "available",
      expected_on: null,
    },
    {
      subject_id: "o3",
      code: "cs",
      name: "Computer Science",
      availability: "available",
      expected_on: null,
    },
  ],
};

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "0";
  server.listen();
});
beforeEach(() =>
  server.use(
    http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(tokensBody("a2", "r2"))),
    http.get(`${API}/api/v1/catalog/grade-levels/c11/pool`, () =>
      HttpResponse.json({ success: true, data: pool, meta: {} }),
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

describe("Pick optionals", () => {
  it("requires the pool count before next", async () => {
    const sent = jest.fn();
    server.use(
      http.post(`${API}/api/v1/me/enrollments/enr-1/optionals`, () => {
        sent();
        return HttpResponse.json({ success: true, data: { id: "enr-1" }, meta: {} });
      }),
    );
    await renderSignedIn(<PickOptionalsScreen />);
    expect(await screen.findByText("Biology")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /Next/i }));
    expect(sent).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Biology"));
    await fireEvent.press(screen.getByText("Mathematics"));
    await fireEvent.press(screen.getByRole("button", { name: /Next/i }));
    await waitFor(() => expect(sent).toHaveBeenCalled());
    expect(routerMock.push).toHaveBeenCalled();
  });
});

describe("Enrol confirm", () => {
  it("confirms the enrollment", async () => {
    const confirmed = jest.fn();
    server.use(
      http.patch(`${API}/api/v1/me/enrollments/enr-1`, () =>
        HttpResponse.json({ success: true, data: { id: "enr-1" }, meta: {} }),
      ),
      http.post(`${API}/api/v1/me/enrollments/enr-1/confirm`, () => {
        confirmed();
        return HttpResponse.json({ success: true, data: { id: "enr-1" }, meta: {} });
      }),
    );
    await renderSignedIn(<EnrolConfirmScreen />);
    expect(await screen.findByText("Physics")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm and start" }));
    await waitFor(() => expect(confirmed).toHaveBeenCalled());
    expect(routerMock.replace).toHaveBeenCalledWith("/home");
  });
});
