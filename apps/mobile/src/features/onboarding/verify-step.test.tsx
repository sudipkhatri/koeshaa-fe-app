import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useSession, type AuthStep } from "@/features/session";
import { API, memoryTokenStore, testCore, tokensBody } from "@/test/api";
import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";
import { server } from "@/test/server";

import { CodeScreen } from "./CodeScreen";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "0";
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = "1";
  server.close();
});

function Ready({ children, step }: { children: ReactNode; step: AuthStep }) {
  const session = useSession();
  const once = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    session.setFlow({
      challenge: "c".repeat(20),
      step,
      setupSecret: step === "mfa_setup" ? "SECRET-KEY-ONCE" : null,
    });
    setReady(true);
  }, [session, step]);
  return ready ? children : null;
}

describe("authenticator sign-in step", () => {
  it("shows recovery codes once and keeps them out of the route and the token store", async () => {
    let posted: { challenge?: string; code?: string } = {};
    server.use(
      http.post(`${API}/api/v1/auth/sign-in/verify`, async ({ request }) => {
        posted = (await request.json()) as { challenge: string; code: string };
        const tokens = {
          ...tokensBody("a1", "r1").data,
          recovery_codes: ["RECOVER-1", "RECOVER-2"],
        };
        return HttpResponse.json({
          success: true,
          data: { tokens, challenge: null },
          meta: {},
        });
      }),
    );
    const store = memoryTokenStore();
    await renderWithProviders(
      <Ready step="mfa_setup">
        <CodeScreen to="" toParent={false} next="signed-in" step="mfa_setup" />
      </Ready>,
      undefined,
      testCore(store),
    );
    expect(await screen.findByText("SECRET-KEY-ONCE")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Digit 1"), "123456");
    expect(await screen.findByText("RECOVER-1")).toBeTruthy();
    expect(screen.getByText("RECOVER-2")).toBeTruthy();
    expect(screen.queryByText("SECRET-KEY-ONCE")).toBeNull();
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(JSON.stringify(routerMock.push.mock.calls)).not.toContain("RECOVER");
    expect(posted).toEqual({ challenge: "c".repeat(20), code: "123456" });
    expect(store.getAccessToken()).toBe("a1");
    expect(await store.getRefreshToken()).toBe("r1");
    await fireEvent.press(screen.getByRole("button", { name: "I have saved these" }));
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/home"));
    expect(screen.queryByText("RECOVER-1")).toBeNull();
  });

  it("sends a recovery code instead of a 6-digit authenticator code", async () => {
    let code = "";
    server.use(
      http.post(`${API}/api/v1/auth/sign-in/verify`, async ({ request }) => {
        code = ((await request.json()) as { code: string }).code;
        return HttpResponse.json({
          success: true,
          data: { tokens: tokensBody("a1", "r1").data, challenge: null },
          meta: {},
        });
      }),
    );
    await renderWithProviders(
      <Ready step="totp">
        <CodeScreen to="" toParent={false} next="signed-in" step="totp" />
      </Ready>,
      undefined,
      testCore(),
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Use a recovery code" }));
    const field = screen.getByLabelText("Recovery code");
    await fireEvent.changeText(field, "short");
    expect(screen.getByRole("button", { name: "Continue" }).props.accessibilityState.disabled).toBe(
      true,
    );
    await fireEvent.changeText(field, "RECOVER-CODE-1");
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(code).toBe("RECOVER-CODE-1"));
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/home"));
  });
});
