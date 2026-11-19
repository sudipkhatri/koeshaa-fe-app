import { screen } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import { API, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { ContentScreen } from "./ContentScreen";
import { SubjectScreen } from "./SubjectScreen";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

beforeAll(() => server.listen());
beforeEach(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "1";
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "1";
  server.close();
});

describe("ContentScreen with a bad reference (demo data)", () => {
  it.each(["nonsense", "maths:1", "maths:99:0", "maths:0:99", "../x:1:2"])(
    "shows the not-found state for %s",
    async (ref) => {
      await renderWithProviders(<ContentScreen contentRef={ref} />);
      expect(await screen.findByText("Nothing here yet")).toBeTruthy();
    },
  );

  it("opens a valid reference", async () => {
    await renderWithProviders(<ContentScreen contentRef={["maths:0:0"]} />);
    expect(await screen.findByText("Lesson content is on its way")).toBeTruthy();
  });
});

describe("real subjects", () => {
  async function renderReal(id: string) {
    process.env.EXPO_PUBLIC_USE_MOCKS = "0";
    const store = memoryTokenStore("refresh-1");
    await store.setTokens({ accessToken: "a1", expiresInSeconds: 900 });
    server.use(
      http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(tokensBody("a2", "r2"))),
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
    );
    await renderWithProviders(<SubjectScreen id={id} />, undefined, testCore(store));
  }

  it("says chapters are coming soon instead of showing demo chapters", async () => {
    await renderReal("mathematics");
    expect(await screen.findByText("Chapters are coming soon")).toBeTruthy();
    expect(screen.queryByText(/Fractions/)).toBeNull();
  });

  it("does not fall back to a demo subject for an unknown id", async () => {
    await renderReal("maths");
    expect(await screen.findByText("Nothing here yet")).toBeTruthy();
    expect(screen.queryByText(/Fractions/)).toBeNull();
  });
});
