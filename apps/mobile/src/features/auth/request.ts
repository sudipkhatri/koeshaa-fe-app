import type { ApiClient } from "@keoshaa/api-client";

import { ApiError } from "@keoshaa/core";

import { currentConsentVersions } from "@/features/legal/api";
import type { TokensRead } from "@/features/session/core";

import { deviceName } from "./device";
import { identifierForApi } from "./identifier";

export function apiError(status: number, code: string, retryAfterSeconds?: number): ApiError {
  return new ApiError(status, { code, message: code }, { retryAfterSeconds });
}

/** Throws when the response has no access token, so the app does not look signed in. */
export function requireAccessToken(tokens: TokensRead | null | undefined): TokensRead {
  if (!tokens?.access_token) throw apiError(500, "HTTP_500");
  return tokens;
}

/** Fields shared by student and parent registration. */
export async function signupFields(
  api: ApiClient,
  signup: { name: string; contact: string; password: string },
  code: string,
  deviceId: string,
) {
  const versions = await currentConsentVersions(api);
  return {
    name: signup.name.trim(),
    identifier: identifierForApi(signup.contact),
    code,
    password: signup.password,
    consents: {
      terms_version: versions.termsVersion,
      privacy_version: versions.privacyVersion,
    },
    device_id: deviceId,
    device_name: deviceName(),
  };
}
