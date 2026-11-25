import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import { API, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";
import { server } from "@/test/server";

import { AskChangeScreen } from "./AskChangeScreen";
import { EnrolmentScreen } from "./EnrolmentScreen";

jest.mock("expo-router", () => ({
  router: jest.requireActual("@/test/router-mock").routerMock,
  useLocalSearchParams: () => ({}),
}));

const enrollment = {
  id: "enr-1",
  academic_year_id: "ay1",
  grade_level_id: "g7",
  stream_id: null,
  pool_version_id: "pv1",
  state: "confirmed",
  source: "self",
  optionals_deferred: false,
  draft_step: 5,
  correction_count: 0,
  changes_left: 2,
  window_open: true,
  read_only: false,
  confirmed_at: "2026-01-01T00:00:00Z",
  window_ends_at: "2026-12-30T18:15:00+05:45",
  parent_contact: null,
  subjects: [
    {
      subject_id: "s1",
      code: "sci",
      name: "Science",
      kind: "compulsory",
      added_at: "2026-01-01T00:00:00Z",
    },
    {
      subject_id: "s2",
      code: "eng",
      name: "English",
      kind: "compulsory",
      added_at: "2026-01-01T00:00:00Z",
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
    http.get(`${API}/api/v1/catalog/academic-years/current`, () =>
      HttpResponse.json({
        success: true,
        data: {
          id: "ay1",
          label: "2083",
          starts_on: "2026-04-14",
          ends_on: "2027-04-13",
          is_current: true,
        },
        meta: {},
      }),
    ),
    http.get(`${API}/api/v1/catalog/grade-levels`, () =>
      HttpResponse.json({
        success: true,
        data: [{ id: "g7", code: "c7", name: "Class 7", stream_required: false }],
        meta: {},
      }),
    ),
    http.get(`${API}/api/v1/me/enrollments`, () =>
      HttpResponse.json({
        success: true,
        data: { current: [enrollment], past: [] },
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

describe("Enrolment manage", () => {
  it("lists class subjects and opens self-serve change when the window is open", async () => {
    await renderSignedIn(<EnrolmentScreen />);
    expect(await screen.findByText("Science")).toBeTruthy();
    expect(screen.getByText("English")).toBeTruthy();
    expect(screen.getByText(/2083/)).toBeTruthy();
    expect(screen.getByText("You can still fix this yourself")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /Change it now/i }));
    expect(routerMock.push).toHaveBeenCalledWith("/onboarding/pick-class");
  });

  it("shows ask-for-change when the window is closed", async () => {
    server.use(
      http.get(`${API}/api/v1/me/enrollments`, () =>
        HttpResponse.json({
          success: true,
          data: {
            current: [{ ...enrollment, window_open: false, changes_left: 0 }],
            past: [],
          },
          meta: {},
        }),
      ),
    );
    await renderSignedIn(<EnrolmentScreen />);
    expect(await screen.findByText("Ask for a change")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /Ask for a change/i }));
    expect(routerMock.push).toHaveBeenCalledWith("/me/enrolment-ask");
  });

  it("shows empty when there is no enrolment", async () => {
    server.use(
      http.get(`${API}/api/v1/me/enrollments`, () =>
        HttpResponse.json({
          success: true,
          data: { current: [], past: [] },
          meta: {},
        }),
      ),
    );
    await renderSignedIn(<EnrolmentScreen />);
    expect(await screen.findByText("No class yet")).toBeTruthy();
  });

  it("posts a change request from the ask form", async () => {
    const sent = jest.fn();
    server.use(
      http.get(`${API}/api/v1/me/enrollments`, () =>
        HttpResponse.json({
          success: true,
          data: {
            current: [{ ...enrollment, window_open: false, changes_left: 0 }],
            past: [],
          },
          meta: {},
        }),
      ),
      http.post(`${API}/api/v1/me/enrollments/enr-1/change-requests`, async ({ request }) => {
        sent(await request.json());
        return HttpResponse.json(
          {
            success: true,
            data: {
              id: "cr1",
              enrollment_id: "enr-1",
              student_id: "u1",
              type: "change_class",
              reason_code: "wrong_class",
              reason_text: null,
              proposed: {},
              status: "submitted",
              decided_by: null,
              decided_at: null,
              decision_note: null,
              created_at: "2026-01-01T00:00:00Z",
            },
            meta: {},
          },
          { status: 201 },
        );
      }),
    );
    await renderSignedIn(<AskChangeScreen />);
    expect(await screen.findByText("What to change")).toBeTruthy();
    await fireEvent.press(screen.getByText("7"));
    await fireEvent.press(screen.getByRole("button", { name: /Send request/i }));
    await waitFor(() => expect(sent).toHaveBeenCalled());
    expect(sent.mock.calls[0][0]).toMatchObject({
      type: "change_class",
      reason_code: "wrong_class",
      proposed: { grade_level_id: "g7" },
    });
  });
});
