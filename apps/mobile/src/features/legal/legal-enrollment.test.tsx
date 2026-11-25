import { fireEvent, renderHook, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";

import { LegalScreen } from "@/features/me/LegalScreen";
import { defaultPreferences } from "@/lib/preferences";
import { SessionRoot } from "@/features/session";
import { AppProviders } from "@/lib/providers";
import {
  API,
  currentAcademicYearHandler,
  enrollmentsHandler,
  enrollmentFixture,
  errorBody,
  gradeLevelsHandler,
  memoryTokenStore,
  testCore,
  tokensBody,
} from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { server } from "@/test/server";

import { useClassInfo } from "../enrollment/api";

import { useLegalPage } from "./api";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "0";
  server.listen();
});
beforeEach(() =>
  server.use(
    http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(tokensBody("a2", "r2"))),
    currentAcademicYearHandler(),
    gradeLevelsHandler(),
  ),
);
afterEach(() => server.resetHandlers());
afterAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "1";
  server.close();
});

async function signedInCore() {
  const store = memoryTokenStore("refresh-1");
  await store.setTokens({ accessToken: "a1", expiresInSeconds: 900 });
  return testCore(store);
}

const wrapperFor = (core: ReturnType<typeof testCore>) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders initial={defaultPreferences}>
        <SessionRoot core={core}>{children}</SessionRoot>
      </AppProviders>
    );
  };

describe("legal pages", () => {
  it("shows a published page with its version", async () => {
    server.use(
      http.get(`${API}/api/v1/site-pages/terms`, () =>
        HttpResponse.json({
          success: true,
          data: { title: "Terms", body: "Be kind.", version: "2027-01" },
          meta: {},
        }),
      ),
    );
    await renderWithProviders(<LegalScreen />, undefined, await signedInCore());
    await fireEvent.press(screen.getByRole("button", { name: /Terms of Use/ }));
    expect(await screen.findByText("Be kind.")).toBeTruthy();
    expect(screen.getByText("Version 2027-01")).toBeTruthy();
  });

  it("falls back to the summary when the page is not published", async () => {
    server.use(
      http.get(`${API}/api/v1/site-pages/terms`, () =>
        HttpResponse.json(errorBody("PAGE_NOT_FOUND"), { status: 404 }),
      ),
    );
    await renderWithProviders(<LegalScreen />, undefined, await signedInCore());
    await fireEvent.press(screen.getByRole("button", { name: /Terms of Use/ }));
    expect(
      await screen.findByText("This is a short summary. The full text is not published yet."),
    ).toBeTruthy();
  });

  it("returns null data for a missing page", async () => {
    server.use(
      http.get(`${API}/api/v1/site-pages/privacy`, () =>
        HttpResponse.json(errorBody("PAGE_NOT_FOUND"), { status: 404 }),
      ),
    );
    const { result } = await renderHook(() => useLegalPage("privacy"), {
      wrapper: wrapperFor(await signedInCore()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe("enrollment", () => {
  it("reads the class and its subjects", async () => {
    server.use(
      enrollmentsHandler([
        enrollmentFixture({}, [
          {
            subject_id: "s1",
            code: "english",
            name: "English",
            kind: "optional",
            added_at: "2026-01-01T00:00:00Z",
          },
        ]),
      ]),
    );
    const { result } = await renderHook(() => useClassInfo(), {
      wrapper: wrapperFor(await signedInCore()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({
      grade: 7,
      confirmed: true,
      subjects: [{ code: "english", optional: true }],
    });
  });

  it("is null when no class is picked yet", async () => {
    server.use(enrollmentsHandler([]));
    const { result } = await renderHook(() => useClassInfo(), {
      wrapper: wrapperFor(await signedInCore()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
