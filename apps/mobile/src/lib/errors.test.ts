import { ApiError, NetworkError } from "@keoshaa/core";

import { errorMessage, retryAfterSeconds, shouldReport, shouldRetry } from "./errors";
import { setErrorReporter } from "./report";

const t = (key: string, params?: Readonly<Record<string, string | number>>) =>
  params?.time ? `${key}|${params.time}` : key;
const clock = (s: number) => `c${s}`;
const msg = (error: unknown) => errorMessage(error, t as never, clock);
const api = (
  status: number,
  code: string,
  options: ConstructorParameters<typeof ApiError>[2] = {},
) => new ApiError(status, { code, message: "server text", details: [] } as never, options);

describe("errorMessage", () => {
  it("explains a connection problem", () => {
    expect(msg(new NetworkError())).toBe("errors.network");
  });

  it("uses the friendly text of a known code, never the server's", () => {
    expect(msg(api(401, "INVALID_CREDENTIALS"))).toBe("errors.INVALID_CREDENTIALS|c60");
  });

  it("tells how long to wait on 429 using retry-after", () => {
    expect(msg(api(429, "RATE", { retryAfterSeconds: 30 }))).toBe("errors.TOO_MANY_REQUESTS|c30");
    expect(msg(api(429, "RATE"))).toBe("errors.TOO_MANY_REQUESTS|c60");
  });

  it("shows the request reference on 5xx", () => {
    expect(msg(api(503, "X", { requestId: "req-1" }))).toBe("errors.HTTP_500\nRef: req-1");
  });

  it("is pure: unknown failures only produce text", () => {
    const reporter = jest.fn();
    setErrorReporter(reporter);
    expect(msg(new Error("boom"))).toBe("errors.unknown");
    expect(msg(api(400, "ODD", { requestId: "r2" }))).toBe("errors.unknown\nRef: r2");
    expect(reporter).not.toHaveBeenCalled();
    setErrorReporter(null);
  });
});

describe("shouldReport", () => {
  it("reports server faults and unknown failures only", () => {
    expect(shouldReport(api(503, "X"))).toBe(true);
    expect(shouldReport(new Error("boom"))).toBe(true);
    expect(shouldReport(api(400, "ODD"))).toBe(false);
    expect(shouldReport(api(429, "RATE"))).toBe(false);
    expect(shouldReport(new NetworkError())).toBe(false);
  });
});

describe("retryAfterSeconds", () => {
  it("is the wait on 429 and zero otherwise", () => {
    expect(retryAfterSeconds(api(429, "RATE", { retryAfterSeconds: 12 }))).toBe(12);
    expect(retryAfterSeconds(api(429, "RATE"))).toBe(60);
    expect(retryAfterSeconds(api(500, "X"))).toBe(0);
    expect(retryAfterSeconds(new Error("x"))).toBe(0);
  });
});

describe("shouldRetry", () => {
  it("retries connection problems and 5xx only", () => {
    expect(shouldRetry(0, new NetworkError())).toBe(true);
    expect(shouldRetry(1, api(500, "X"))).toBe(true);
    expect(shouldRetry(0, api(404, "X"))).toBe(false);
    expect(shouldRetry(0, new Error("x"))).toBe(false);
  });

  it("gives up after two failures", () => {
    expect(shouldRetry(2, new NetworkError())).toBe(false);
  });
});
