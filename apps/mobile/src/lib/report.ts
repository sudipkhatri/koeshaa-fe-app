export interface ErrorContext {
  /** Where it happened: "query" or "mutation". No user data. */
  source: string;
  status?: number;
  code?: string;
  requestId?: string;
}

type Reporter = (error: unknown, context: ErrorContext) => void;

const devReporter: Reporter = (error, context) => {
  if (__DEV__) console.warn("[report]", context, error instanceof Error ? error.name : "unknown");
};

let reporter: Reporter = devReporter;

/** Plug a crash reporter in here at startup; the default logs in dev and does nothing in release. */
export function setErrorReporter(next: Reporter | null): void {
  reporter = next ?? devReporter;
}

/** Sends an unexpected failure to the reporter. Context must never hold personal data. */
export function reportError(error: unknown, context: ErrorContext): void {
  try {
    reporter(error, context);
  } catch {
    // Reporting must never break the screen.
  }
}
