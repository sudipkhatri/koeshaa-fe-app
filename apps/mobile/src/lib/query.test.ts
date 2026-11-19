import { ApiError, NetworkError } from "@keoshaa/core";

import { shouldRetry } from "./errors";
import { createQueryClient, keys } from "./query";
import { setErrorReporter } from "./report";

describe("createQueryClient", () => {
  it("retries with the shared policy and backs off up to 8 seconds", () => {
    const q = createQueryClient().getDefaultOptions().queries!;
    expect(q.retry).toBe(shouldRetry);
    const delay = q.retryDelay as (n: number) => number;
    expect(delay(0)).toBe(1000);
    expect(delay(2)).toBe(4000);
    expect(delay(10)).toBe(8000);
    expect(q.refetchOnWindowFocus).toBe(false);
  });

  it("can turn retries off and never retries mutations", () => {
    const client = createQueryClient({ retry: false });
    expect(client.getDefaultOptions().queries!.retry).toBe(false);
    expect(client.getDefaultOptions().mutations!.retry).toBe(false);
  });

  it("builds stable keys", () => {
    expect(keys.pool("7", null)).toEqual(["catalog", "pool", "7", null]);
  });
});

describe("error reporting", () => {
  const reporter = jest.fn();
  beforeEach(() => {
    reporter.mockClear();
    setErrorReporter(reporter);
  });
  afterAll(() => setErrorReporter(null));

  const fail = (client: ReturnType<typeof createQueryClient>, error: Error) =>
    client
      .fetchQuery({ queryKey: ["x", Math.random()], queryFn: () => Promise.reject(error) })
      .catch(() => undefined);

  it("reports a failed 5xx query once, with no personal data", async () => {
    const error = new ApiError(503, { code: "X", message: "secret text", details: [] } as never, {
      requestId: "req-1",
    });
    await fail(createQueryClient({ retry: false }), error);
    expect(reporter).toHaveBeenCalledTimes(1);
    expect(reporter).toHaveBeenCalledWith(error, {
      source: "query",
      status: 503,
      code: "X",
      requestId: "req-1",
    });
  });

  it("reports unknown failures but not connection or client errors", async () => {
    const client = createQueryClient({ retry: false });
    await fail(client, new Error("boom"));
    await fail(client, new NetworkError());
    await fail(client, new ApiError(400, { code: "ODD", message: "m", details: [] } as never, {}));
    expect(reporter).toHaveBeenCalledTimes(1);
  });

  it("reports failed mutations", async () => {
    const client = createQueryClient({ retry: false });
    await client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(new Error("boom")) })
      .execute(undefined)
      .catch(() => undefined);
    expect(reporter).toHaveBeenCalledWith(expect.any(Error), { source: "mutation" });
  });
});
