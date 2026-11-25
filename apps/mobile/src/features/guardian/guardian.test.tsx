import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";

import { API, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";
import { server } from "@/test/server";

import { AcceptInvitationScreen } from "./AcceptInvitationScreen";
import { InvitationsScreen } from "./InvitationsScreen";

jest.mock("expo-router", () => ({
  router: jest.requireActual("@/test/router-mock").routerMock,
  useLocalSearchParams: () => ({ id: "inv-1" }),
}));

const invite = {
  id: "inv-1",
  parent_id: null,
  student_id: "stu-1",
  relationship: "mother",
  state: "pending",
  invited_phone: "+9779800000044",
  expires_at: "2026-12-01T00:00:00Z",
  accepted_at: null,
  created_by: "stu-1",
};

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "0";
  server.listen();
});
beforeEach(() =>
  server.use(
    http.post(`${API}/api/v1/auth/refresh`, () => HttpResponse.json(tokensBody("a2", "r2"))),
    http.get(`${API}/api/v1/me/guardian-invitations`, () =>
      HttpResponse.json({ success: true, data: [invite], meta: {} }),
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

describe("Guardian invitations", () => {
  it("lists pending invites for the parent", async () => {
    await renderSignedIn(<InvitationsScreen />);
    expect(await screen.findByText("Waiting for you")).toBeTruthy();
    expect(screen.getByText("+9779800000044")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
  });

  it("accepts an invitation", async () => {
    const accepted = jest.fn();
    server.use(
      http.post(`${API}/api/v1/me/guardian-invitations/inv-1/accept`, () => {
        accepted();
        return HttpResponse.json({
          success: true,
          data: { ...invite, state: "active", accepted_at: "2026-01-01T00:00:00Z" },
          meta: {},
        });
      }),
    );
    await renderSignedIn(<AcceptInvitationScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: /Yes, I am their mother/i }));
    await waitFor(() => expect(accepted).toHaveBeenCalled());
    expect(routerMock.replace).toHaveBeenCalledWith("/(tabs)/home");
  });

  it("declines by ending the guardianship", async () => {
    const ended = jest.fn();
    server.use(
      http.delete(`${API}/api/v1/me/guardianships/inv-1`, () => {
        ended();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await renderSignedIn(<AcceptInvitationScreen />);
    await fireEvent.press(
      await screen.findByRole("button", { name: "No, I do not know this person" }),
    );
    await waitFor(() => expect(ended).toHaveBeenCalled());
  });
});
