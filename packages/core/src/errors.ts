import type { ApiErrorBody, ErrorDetail } from "./envelope";

/** A failed API call, from the envelope (`code` is stable; `message` is for people). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: readonly ErrorDetail[];
  readonly requestId: string | undefined;
  readonly retryAfterSeconds: number | undefined;

  constructor(
    status: number,
    body: ApiErrorBody,
    options: { requestId?: string | undefined; retryAfterSeconds?: number | undefined } = {},
  ) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details ?? [];
    this.requestId = options.requestId;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }

  /** Field errors keyed by field name, for forms. */
  fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const detail of this.details) {
      if (detail.field && !(detail.field in result)) result[detail.field] = detail.message;
    }
    return result;
  }
}

/** No response at all (offline, DNS, timeout): show "No connection", keep the form values. */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super("Network request failed", { cause });
    this.name = "NetworkError";
  }
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}
