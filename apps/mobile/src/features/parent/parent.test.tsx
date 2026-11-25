import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import { HomeScreen } from "@/features/home/HomeScreen";
import { API, errorBody, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";
import { server } from "@/test/server";

import { AddChildScreen } from "./AddChildScreen";
import { ChildDetailScreen } from "./ChildDetailScreen";
import { ParentHomeScreen } from "./ParentHomeScreen";

jest.mock("expo-router", () => ({
  router: jest.requireActual("@/test/router-mock").routerMock,
  useLocalSearchParams: () => ({ id: "child-1" }),
}));

const parentUser = {
  ...tokensBody("a", "r", "Sita Khadka").data.user,
  date_of_birth: null as string | null,
};

const parentProfile = () =>
  http.get(`${API}/api/v1/me`, () =>
    HttpResponse.json({
      success: true,
      data: {
        user: parentUser,
        second_device_notice: false,
        missing_consents: [],
        mfa_enabled: false,
      },
      meta: {},
    }),
  );

const childrenList = (
  rows: {
    user_id: string;
    name: string;
    relationship: string;
    grade?: string | null;
  }[] = [
    {
      user_id: "child-1",
      name: "Asha Shrestha",
      relationship: "mother",
      grade: "Class 11",
    },
  ],
) =>
  http.get(`${API}/api/v1/me/children`, () =>
    HttpResponse.json({ success: true, data: rows, meta: {} }),
  );

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "0";
  server.listen();
});
beforeEach(() =>
  server.use(
    http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(tokensBody("a2", "r2"))),
    parentProfile(),
    childrenList(),
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

describe("Parent home", () => {
  it("lists children from the API", async () => {
    await renderSignedIn(<ParentHomeScreen />);
    expect(await screen.findByText("Your children")).toBeTruthy();
    expect(await screen.findByText("Asha")).toBeTruthy();
    expect(screen.getByText(/Class 11/)).toBeTruthy();
  });

  it("shows empty when there are no children", async () => {
    server.use(childrenList([]));
    await renderSignedIn(<ParentHomeScreen />);
    expect(await screen.findByText("No children yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add a child" })).toBeTruthy();
  });

  it("shows an error when the list fails", async () => {
    server.use(
      http.get(`${API}/api/v1/me/children`, () =>
        HttpResponse.json(errorBody("HTTP_500"), { status: 500 }),
      ),
    );
    await renderSignedIn(<ParentHomeScreen />);
    expect(await screen.findByText("Oops, that was on us")).toBeTruthy();
  });

  it("omits grade when the API leaves it out", async () => {
    server.use(
      childrenList([
        { user_id: "child-2", name: "Bikash Shrestha", relationship: "father", grade: null },
      ]),
    );
    await renderSignedIn(<ParentHomeScreen />);
    expect(await screen.findByText("Bikash")).toBeTruthy();
    expect(screen.getByText("father")).toBeTruthy();
    expect(screen.queryByText(/Class \d/)).toBeNull();
  });

  it("replaces the student home when the profile is a parent", async () => {
    await renderSignedIn(<HomeScreen />);
    expect(await screen.findByText("Your children")).toBeTruthy();
    expect(screen.queryByText("Your subjects")).toBeNull();
  });
});

describe("Add child", () => {
  it("requires a name before sending", async () => {
    const sent = jest.fn();
    server.use(
      http.post(`${API}/api/v1/me/children`, () => {
        sent();
        return HttpResponse.json({ success: true, data: { user_id: "x" } }, { status: 201 });
      }),
    );
    await renderSignedIn(<AddChildScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Add child" }));
    expect(await screen.findByText("Please enter their name.")).toBeTruthy();
    expect(sent).not.toHaveBeenCalled();
  });

  it("posts child fields and consents", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.get(`${API}/api/v1/site-pages/terms`, () =>
        HttpResponse.json({
          success: true,
          data: { title: "T", body: "b", version: "2026-10", slug: "terms" },
          meta: {},
        }),
      ),
      http.get(`${API}/api/v1/site-pages/privacy`, () =>
        HttpResponse.json({
          success: true,
          data: { title: "P", body: "b", version: "2026-10", slug: "privacy" },
          meta: {},
        }),
      ),
      http.post(`${API}/api/v1/me/children`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            success: true,
            data: {
              user_id: "child-new",
              name: "Asha Shrestha",
              sign_in_with: "asha",
              under_13: false,
            },
            meta: {},
          },
          { status: 201 },
        );
      }),
    );
    await renderSignedIn(<AddChildScreen />);
    await fireEvent.changeText(screen.getByLabelText("Their name"), "Asha Shrestha");
    await fireEvent.press(screen.getByLabelText(/Day/i));
    // Birthday select fields: set via change after opening is awkward; fill by pressing options if sheet opens.
    // Use direct schema path: set day/month/year through accessibility labels from SelectField.
    await fireEvent.press(await screen.findByText("1"));
    await fireEvent.press(screen.getByLabelText(/Month/i));
    await fireEvent.press(await screen.findByText("January"));
    await fireEvent.press(screen.getByLabelText(/Year/i));
    await fireEvent.press(await screen.findByText("2012"));
    await fireEvent.changeText(screen.getByLabelText("How they will sign in"), "asha.shrestha");
    await fireEvent.changeText(screen.getByLabelText("First password"), "Himal-2083");
    await fireEvent.press(screen.getByRole("button", { name: "Add child" }));
    await waitFor(() => expect(body.child).toBeTruthy());
    expect(body).toMatchObject({
      child: {
        name: "Asha Shrestha",
        date_of_birth: "2012-01-01",
        relationship: "mother",
        username: "asha.shrestha",
        password: "Himal-2083",
      },
      consents: { terms_version: "2026-10", privacy_version: "2026-10" },
    });
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith({
        pathname: "/parent/child/[id]",
        params: { id: "child-new" },
      }),
    );
  });
});

describe("Child detail", () => {
  beforeEach(() => {
    server.use(
      http.get(`${API}/api/v1/me/children/child-1/devices`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: "d1",
              name: "Redmi Note 12",
              first_seen_at: "2026-01-01T00:00:00Z",
              last_seen_at: new Date().toISOString(),
              current: false,
            },
          ],
          meta: {},
        }),
      ),
    );
  });

  it("lists devices and can sign one out", async () => {
    const removed = jest.fn();
    server.use(
      http.delete(`${API}/api/v1/me/children/child-1/devices/d1`, () => {
        removed();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await renderSignedIn(<ChildDetailScreen childId="child-1" />);
    expect(await screen.findByText("Redmi Note 12")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Sign out Redmi Note 12"));
    await fireEvent.press(screen.getByRole("button", { name: "Yes, sign it out" }));
    await waitFor(() => expect(removed).toHaveBeenCalled());
  });

  it("sets a password with the parent's password", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${API}/api/v1/me/children/child-1/password`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await renderSignedIn(<ChildDetailScreen childId="child-1" />);
    await fireEvent.press(await screen.findByRole("button", { name: "Set a new password" }));
    await fireEvent.changeText(screen.getByLabelText("New password"), "new-pass-99");
    await fireEvent.changeText(screen.getByLabelText("Your password"), "parent-pass");
    await fireEvent.press(screen.getAllByRole("button", { name: "Set a new password" })[1]!);
    await waitFor(() =>
      expect(body).toEqual({ password: "new-pass-99", parent_password: "parent-pass" }),
    );
  });

  it("closes the child account with the parent password", async () => {
    let body: Record<string, unknown> = {};
    server.use(
      http.post(`${API}/api/v1/me/children/child-1/close`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await renderSignedIn(<ChildDetailScreen childId="child-1" />);
    await fireEvent.press(await screen.findByRole("button", { name: "Close account" }));
    await fireEvent.changeText(
      screen.getByLabelText("Enter your password to confirm"),
      "parent-pass",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Close their account" }));
    await waitFor(() => expect(body).toEqual({ password: "parent-pass" }));
    expect(routerMock.replace).toHaveBeenCalledWith("/(tabs)/home");
  });
});
