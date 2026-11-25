import { screen } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";

import {
  API,
  currentAcademicYearHandler,
  enrollmentsHandler,
  enrollmentFixture,
  gradeLevelsHandler,
  memoryTokenStore,
  testCore,
  tokensBody,
} from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { ContentScreen } from "./ContentScreen";
import { ChapterScreen } from "./ChapterScreen";
import { SubjectScreen } from "./SubjectScreen";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

beforeAll(() => server.listen());
beforeEach(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "1";
});
afterEach(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "1";
  server.resetHandlers();
});
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

const emptySlice = () =>
  http.get(`${API}/api/v1/catalog/grade-levels/:grade/free-slice`, () =>
    HttpResponse.json({
      success: true,
      data: { grade_level_id: "g7", stream_id: null, subjects: [] },
      meta: {},
    }),
  );

function sliceNamed(name: string) {
  return http.get(`${API}/api/v1/catalog/grade-levels/:grade/free-slice`, () =>
    HttpResponse.json({
      success: true,
      data: {
        grade_level_id: "g7",
        stream_id: null,
        subjects: [
          {
            subject_id: "01J9Z8Y7X6W5V4T3S2R1Q0P9N8",
            code: "mathematics",
            name: "Mathematics",
            chapters: [{ chapter_id: "01J9Z8Y7X6W5V4T3S2R1Q0P9N7", number: 1, name }],
          },
        ],
      },
      meta: {},
    }),
  );
}
describe("real subjects", () => {
  async function renderReal(ui: ReactElement, slice: ReturnType<typeof emptySlice> = emptySlice()) {
    process.env.EXPO_PUBLIC_USE_MOCKS = "0";
    const store = memoryTokenStore("refresh-1");
    await store.setTokens({ accessToken: "a1", expiresInSeconds: 900 });
    server.use(
      http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(tokensBody("a2", "r2"))),
      currentAcademicYearHandler(),
      gradeLevelsHandler(),
      enrollmentsHandler([enrollmentFixture()]),
      slice,
    );
    await renderWithProviders(ui, undefined, testCore(store));
  }

  it("says chapters are coming soon when the free slice has none", async () => {
    await renderReal(<SubjectScreen id="mathematics" />);
    expect(await screen.findByText("Chapters are coming soon")).toBeTruthy();
    expect(screen.queryByText(/Fractions/)).toBeNull();
  });

  it("shows the free chapter name from the API", async () => {
    await renderReal(<SubjectScreen id="mathematics" />, sliceNamed("Algebra"));
    expect(await screen.findByText("Algebra")).toBeTruthy();
    expect(screen.queryByText("Chapters are coming soon")).toBeNull();
    expect(screen.queryByText(/Fractions/)).toBeNull();
  });

  it("shows an error when the free slice fails", async () => {
    await renderReal(
      <SubjectScreen id="mathematics" />,
      http.get(`${API}/api/v1/catalog/grade-levels/:grade/free-slice`, () =>
        HttpResponse.json(
          { success: false, error: { code: "HTTP_500", message: "no" } },
          { status: 500 },
        ),
      ),
    );
    expect(await screen.findByText("Oops, that was on us")).toBeTruthy();
  });

  it("says there is no connection when the free slice cannot be reached", async () => {
    await renderReal(
      <SubjectScreen id="mathematics" />,
      http.get(`${API}/api/v1/catalog/grade-levels/:grade/free-slice`, () => HttpResponse.error()),
    );
    expect(await screen.findByText("No connection")).toBeTruthy();
  });

  it("does not show demo lessons for a free chapter", async () => {
    await renderReal(<ChapterScreen chapterRef="mathematics:0" />, sliceNamed("Algebra"));
    expect(await screen.findByText("Lessons are coming soon")).toBeTruthy();
    expect(screen.queryByText("Introduction")).toBeNull();
  });

  it("does not fall back to a demo subject for an unknown id", async () => {
    await renderReal(<SubjectScreen id="maths" />);
    expect(await screen.findByText("Nothing here yet")).toBeTruthy();
    expect(screen.queryByText(/Fractions/)).toBeNull();
  });
});
