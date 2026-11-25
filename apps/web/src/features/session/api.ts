import { ApiError, normaliseIdentifier, type SignInValues } from "@keoshaa/core";
import type { components } from "@keoshaa/api-client";

import { api } from "@/lib/api";
import { browserDeviceId } from "@/lib/device";
import { setAccessToken } from "@/lib/session";

type SignInRead = components["schemas"]["SignInRead"];
type TokensRead = components["schemas"]["TokensRead"];

function identifierForApi(raw: string): string {
  const normalised = normaliseIdentifier(raw);
  if (!normalised)
    throw new ApiError(400, { code: "VALIDATION_ERROR", message: "VALIDATION_ERROR" });
  return normalised.value;
}

function requireSignIn(body: { data?: SignInRead } | undefined): SignInRead {
  if (!body?.data) throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
  return body.data;
}

export function acceptTokens(tokens: TokensRead | null | undefined): void {
  if (!tokens?.access_token) throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
  setAccessToken(tokens.access_token);
}

export async function requestSignIn(values: SignInValues): Promise<SignInRead> {
  const { data } = await api.POST("/api/v1/auth/sign-in", {
    body: {
      identifier: identifierForApi(values.identifier),
      password: values.password,
      device_id: browserDeviceId(),
      device_name: "Web browser",
    },
  });
  return requireSignIn(data);
}

export async function verifySignIn(challenge: string, code: string): Promise<SignInRead> {
  const { data } = await api.POST("/api/v1/auth/sign-in/verify", {
    body: { challenge, code },
  });
  return requireSignIn(data);
}

export async function signOutRequest(): Promise<void> {
  try {
    await api.POST("/api/v1/auth/sign-out");
  } finally {
    setAccessToken(null);
  }
}

export type CodeSent = components["schemas"]["CodeSentRead"];

export async function requestResetCode(identifier: string): Promise<CodeSent> {
  const { data } = await api.POST("/api/v1/auth/codes", {
    body: { purpose: "reset", identifier: identifierForApi(identifier) },
  });
  if (!data?.data) throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
  return data.data;
}

export async function resetPassword(input: {
  identifier: string;
  code: string;
  password: string;
}): Promise<void> {
  await api.POST("/api/v1/auth/password/reset", {
    body: {
      identifier: identifierForApi(input.identifier),
      code: input.code,
      password: input.password,
    },
  });
}
