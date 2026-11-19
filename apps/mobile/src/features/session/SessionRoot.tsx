import { useState } from "react";
import type { ReactNode } from "react";

import { isMockMode } from "@/lib/config";

import type { SessionCore } from "./core";
import { SessionProvider } from "./session";
import { getSessionCore } from "./shared-core";

/** Builds the app's session once (none in mock mode) and provides it; tests pass their own core. */
export function SessionRoot({
  core,
  children,
}: {
  core?: SessionCore | null;
  children: ReactNode;
}) {
  const [sessionCore] = useState(() =>
    core !== undefined ? core : isMockMode() ? null : getSessionCore(),
  );
  return <SessionProvider core={sessionCore}>{children}</SessionProvider>;
}
