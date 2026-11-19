import { useMutation } from "@tanstack/react-query";
import * as Device from "expo-device";

import { ApiError } from "@keoshaa/core";

import { useApi } from "@/features/session/use-api";
import { currentConsentVersions } from "@/features/legal/api";
import { useSession } from "@/features/session";
import { checkSignIn, isCorrectCode } from "@/features/onboarding/mock";

export type SignInResult =
  { kind: "signedIn"; name: string } | { kind: "needsCode"; challenge: string; sentTo: string };

const fail = (status: number, code: string, retryAfterSeconds?: number) =>
  new ApiError(status, { code, message: code }, { retryAfterSeconds });

/** Mock sign-in lock: five wrong passwords pause sign in for 15 minutes (demo only). */
let mockWrong = 0;
let mockLockedUntil = 0;
let mockCodeTries = 0;

export function resetMockAuth(): void {
  mockWrong = 0;
  mockLockedUntil = 0;
  mockCodeTries = 0;
}

async function mockSignIn(id: string, password: string): Promise<SignInResult> {
  const left = Math.ceil((mockLockedUntil - Date.now()) / 1000);
  if (left > 0) throw fail(429, "SIGN_IN_LOCKED", left);
  const outcome = checkSignIn(id, password);
  if (outcome.status === "missing" || outcome.status === "wrong") {
    if (++mockWrong >= 5) {
      mockWrong = 0;
      mockLockedUntil = Date.now() + 15 * 60_000;
      throw fail(429, "SIGN_IN_LOCKED", 15 * 60);
    }
    throw fail(401, "INVALID_CREDENTIALS");
  }
  mockWrong = 0;
  if (outcome.status === "signedIn") return { kind: "signedIn", name: "Aarav" };
  return { kind: "needsCode", challenge: "mock", sentTo: outcome.maskedTo };
}

export function useSignIn() {
  const api = useApi();
  const session = useSession();
  return useMutation({
    mutationFn: async (input: { identifier: string; password: string }): Promise<SignInResult> => {
      if (!api || !session.core) {
        const result = await mockSignIn(input.identifier, input.password);
        if (result.kind === "signedIn") await session.signIn(null);
        else
          session.setFlow({
            identifier: input.identifier,
            challenge: result.challenge,
            sentTo: result.sentTo,
          });
        return result;
      }
      const deviceId = await session.core.getDeviceId();
      const { data } = await api.POST("/api/v1/auth/sign-in", {
        body: {
          identifier: input.identifier.trim(),
          password: input.password,
          device_id: deviceId,
          device_name: deviceName(),
        },
      });
      const body = data?.data;
      if (body?.tokens) {
        await session.signIn(body.tokens);
        return { kind: "signedIn", name: body.tokens.user.name };
      }
      if (body?.challenge) {
        session.setFlow({
          identifier: input.identifier.trim(),
          challenge: body.challenge.challenge,
          sentTo: body.challenge.sent_to ?? "",
        });
        return {
          kind: "needsCode",
          challenge: body.challenge.challenge,
          sentTo: body.challenge.sent_to ?? "",
        };
      }
      throw fail(500, "HTTP_500");
    },
  });
}

/** New-device sign-in, step 2: the code that was sent to the account's contact. */
export function useVerifySignIn() {
  const api = useApi();
  const session = useSession();
  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      if (!api) {
        if (!isCorrectCode(code)) {
          if (++mockCodeTries >= 3) throw fail(401, "CHALLENGE_EXPIRED");
          throw fail(400, "INVALID_CODE");
        }
        await session.signIn(null);
        return "Aarav";
      }
      const { data } = await api.POST("/api/v1/auth/sign-in/verify", {
        body: { challenge: session.flow.challenge ?? "", code },
      });
      const tokens = data?.data.tokens;
      if (!tokens) throw fail(500, "HTTP_500");
      await session.signIn(tokens);
      return tokens.user.name;
    },
  });
}

/** Sends a sign-up or password-reset code. The answer is the same whether or not an account exists. */
export function useRequestCode() {
  const api = useApi();
  const session = useSession();
  return useMutation({
    mutationFn: async (input: { purpose: "signup" | "reset"; identifier: string }) => {
      session.setFlow({ identifier: input.identifier.trim(), challenge: null, code: "" });
      if (!api) return;
      await api.POST("/api/v1/auth/codes", {
        body: { purpose: input.purpose, identifier: input.identifier.trim() },
      });
    },
  });
}

/** `YYYY-MM-DD` from the day, month and year pickers. */
export const isoDate = (year: string, month: string, day: string) =>
  `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

export function useRegisterStudent() {
  const api = useApi();
  const session = useSession();
  return useMutation({
    mutationFn: async () => {
      if (!api || !session.core) {
        await session.signIn(null);
        return;
      }
      const { signup, flow } = session;
      const versions = await currentConsentVersions(api);
      const { data } = await api.POST("/api/v1/auth/register/student", {
        body: {
          name: signup.name.trim(),
          date_of_birth: isoDate(signup.year, signup.month, signup.day),
          identifier: signup.contact.trim(),
          code: flow.code,
          password: signup.password,
          consents: {
            terms_version: versions.termsVersion,
            privacy_version: versions.privacyVersion,
          },
          device_id: await session.core.getDeviceId(),
          device_name: deviceName(),
        },
      });
      await session.signIn(data?.data ?? null);
      session.updateSignup({ password: "", code: "" });
    },
  });
}

export function useResetPassword() {
  const api = useApi();
  const session = useSession();
  return useMutation({
    mutationFn: async (password: string) => {
      if (!api) return;
      await api.POST("/api/v1/auth/password/reset", {
        body: { identifier: session.flow.identifier, code: session.flow.code, password },
      });
    },
  });
}

function deviceName(): string | null {
  return Device.deviceName ?? Device.modelName ?? null;
}

export const useSignedOutEverywhere = () => {
  const session = useSession();
  return useMutation({ mutationFn: () => session.signOutEverywhere() });
};

export const isLockedError = (error: unknown): boolean =>
  error instanceof ApiError && error.code === "SIGN_IN_LOCKED";
