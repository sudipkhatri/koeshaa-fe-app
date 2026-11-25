import type { DeviceIdentity, TokenStore } from "@keoshaa/core";
import { http, HttpResponse } from "msw";

import { createSessionCore } from "@/features/session/core";

import { API } from "./server";
import type { TokensRead } from "@/features/session/core";

export { API };

/** Minimal `EnrollmentRead` for MSW; matches the fields `loadClassInfo` reads. */
export function enrollmentFixture(
  overrides: Record<string, unknown> = {},
  subjects?: readonly Record<string, unknown>[],
) {
  return {
    id: "e1",
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
    subjects: subjects ?? [
      {
        subject_id: "s1",
        code: "mathematics",
        name: "Mathematics",
        kind: "compulsory",
        added_at: "2026-01-01T00:00:00Z",
      },
    ],
    ...overrides,
  };
}

export const currentAcademicYearHandler = () =>
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
  );

export const gradeLevelsHandler = () =>
  http.get(`${API}/api/v1/catalog/grade-levels`, () =>
    HttpResponse.json({
      success: true,
      data: [{ id: "g7", code: "c7", name: "Class 7", stream_required: false }],
      meta: {},
    }),
  );

export const enrollmentsHandler = (
  current: readonly Record<string, unknown>[] = [enrollmentFixture()],
) =>
  http.get(`${API}/api/v1/me/enrollments`, () =>
    HttpResponse.json({
      success: true,
      data: { current, past: [] },
      meta: {},
    }),
  );

/** Token store that keeps everything in memory, for tests. */
export function memoryTokenStore(refreshToken: string | null = null) {
  let access: string | null = null;
  let refresh = refreshToken;
  const store: TokenStore = {
    getAccessToken: () => access,
    async setTokens(tokens) {
      access = tokens.accessToken;
      if (tokens.refreshToken) refresh = tokens.refreshToken;
    },
    getRefreshToken: async () => refresh,
    async clear() {
      access = null;
      refresh = null;
    },
  };
  return store;
}

const device: DeviceIdentity = { getDeviceId: async () => "device-1" };

export function testCore(store: TokenStore = memoryTokenStore()) {
  return createSessionCore({ baseUrl: API, store, device });
}

export function tokensBody(access: string, refresh: string, name = "Aarav") {
  const tokens: TokensRead = {
    access_token: access,
    refresh_token: refresh,
    token_type: "bearer",
    expires_in: 900,
    session_id: "s1",
    user: {
      id: "u1",
      account_kind: "member",
      status: "active",
      name,
      date_of_birth: "2012-01-01",
      dob_source: null,
      source: "self",
      locale: "en",
      mfa_required: false,
      under_13: false,
      identifiers: [],
      created_at: "2026-01-01T00:00:00Z",
      purge_after: null,
    },
  };
  return { success: true, data: tokens, meta: {} };
}

export const errorBody = (code: string) => ({
  success: false,
  error: { code, message: code, details: null },
  meta: {},
});
