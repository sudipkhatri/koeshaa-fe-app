import { useMutation } from "@tanstack/react-query";

import { ApiError } from "@keoshaa/core";

import { useApi } from "@/features/session/use-api";
import { useSession, type AuthStep } from "@/features/session";
import { checkSignIn, isCorrectCode } from "@/features/onboarding/mock";

import { deviceName } from "./device";
import { identifierForApi } from "./identifier";
import { apiError, requireAccessToken, signupFields } from "./request";

export type SignInResult =
  | { kind: "signedIn"; name: string }
  | { kind: "needsCode"; challenge: string; sentTo: string; step: AuthStep };

export interface CodeSent {
  sentTo: string;
  expiresIn: number;
}

/** Sign-in step 2. `recoveryCodes` is set only after authenticator setup and is not stored. */
export interface VerifiedSignIn {
  name: string;
  recoveryCodes: string[];
}

/** Mock sign-in lock: five wrong passwords pause sign in for 15 minutes (demo only). */
let mockWrong = 0;
let mockLockedUntil = 0;
let mockCodeTries = 0;

export function resetMockAuth(): void {
  mockWrong = 0;
  mockLockedUntil = 0;
  mockCodeTries = 0;
}

async function mockSignIn(identifier: string, password: string): Promise<SignInResult> {
  const secondsRemaining = Math.ceil((mockLockedUntil - Date.now()) / 1000);
  if (secondsRemaining > 0) throw apiError(429, "SIGN_IN_LOCKED", secondsRemaining);
  const outcome = checkSignIn(identifier, password);
  if (outcome.status === "missing" || outcome.status === "wrong") {
    if (++mockWrong >= 5) {
      mockWrong = 0;
      mockLockedUntil = Date.now() + 15 * 60_000;
      throw apiError(429, "SIGN_IN_LOCKED", 15 * 60);
    }
    throw apiError(401, "INVALID_CREDENTIALS");
  }
  mockWrong = 0;
  if (outcome.status === "signedIn") return { kind: "signedIn", name: "Aarav" };
  return { kind: "needsCode", challenge: "mock", sentTo: outcome.maskedTo, step: "code" };
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
      const identifier = identifierForApi(input.identifier);
      const deviceId = await session.core.getDeviceId();
      const { data } = await api.POST("/api/v1/auth/sign-in", {
        body: {
          identifier,
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
        const step = toAuthStep(body.challenge.step);
        session.setFlow({
          identifier,
          challenge: body.challenge.challenge,
          sentTo: body.challenge.sent_to ?? "",
          step,
          setupSecret: step === "mfa_setup" ? (body.challenge.authenticator_secret ?? null) : null,
          code: "",
        });
        return {
          kind: "needsCode",
          challenge: body.challenge.challenge,
          sentTo: body.challenge.sent_to ?? "",
          step,
        };
      }
      throw apiError(500, "HTTP_500");
    },
  });
}

/** Sign-in step 2: a device code, an authenticator code, or a recovery code. */
export function useVerifySignIn() {
  const api = useApi();
  const session = useSession();
  return useMutation({
    mutationFn: async (code: string): Promise<VerifiedSignIn> => {
      if (!api) {
        if (!isCorrectCode(code)) {
          if (++mockCodeTries >= 3) throw apiError(401, "CHALLENGE_EXPIRED");
          throw apiError(400, "INVALID_CODE");
        }
        await session.signIn(null);
        return { name: "Aarav", recoveryCodes: [] };
      }
      const { data } = await api.POST("/api/v1/auth/sign-in/verify", {
        body: { challenge: session.flow.challenge ?? "", code },
      });
      const tokens = requireAccessToken(data?.data.tokens);
      const recoveryCodes = (tokens.recovery_codes ?? []).filter((code) => code.length > 0);
      await session.signIn(tokens);
      session.setFlow({ setupSecret: null, challenge: null });
      return { name: tokens.user.name, recoveryCodes };
    },
  });
}

/** Sends a sign-up or password-reset code. The answer is the same whether or not an account exists. */
export function useRequestCode() {
  const api = useApi();
  const session = useSession();
  return useMutation({
    mutationFn: async (input: {
      purpose: "signup" | "reset";
      identifier: string;
    }): Promise<CodeSent> => {
      const identifier = identifierForApi(input.identifier);
      session.setFlow({
        identifier,
        challenge: null,
        code: "",
        step: "code",
        setupSecret: null,
      });
      if (!api) return { sentTo: "", expiresIn: 60 };
      const { data } = await api.POST("/api/v1/auth/codes", {
        body: { purpose: input.purpose, identifier },
      });
      return { sentTo: data?.data.sent_to ?? "", expiresIn: data?.data.expires_in ?? 60 };
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
      const { data } = await api.POST("/api/v1/auth/register/student", {
        body: {
          ...(await signupFields(api, signup, flow.code, await session.core.getDeviceId())),
          date_of_birth: isoDate(signup.year, signup.month, signup.day),
        },
      });
      await session.signIn(requireAccessToken(data?.data));
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
        body: {
          identifier: identifierForApi(session.flow.identifier),
          code: session.flow.code,
          password,
        },
      });
    },
  });
}

function toAuthStep(step: string): AuthStep {
  return step === "totp" || step === "mfa_setup" ? step : "code";
}

export { useRecoveryRequest, useRegisterParent } from "./account";

export const isLockedError = (error: unknown): boolean =>
  error instanceof ApiError && error.code === "SIGN_IN_LOCKED";
