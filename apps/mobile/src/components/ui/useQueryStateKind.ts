import { useOnline } from "@/lib/connectivity";
import { isNetworkError } from "@/lib/errors";

import type { StateKind } from "./StateView";

interface QueryLike {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  /** True once there is something to show (cached data still counts while refetching). */
  hasData: boolean;
}

/**
 * Which StateView a query-driven screen shows, or null when it can show its data.
 * No connection wins while data is missing, so a paused query never spins forever.
 */
export function useQueryStateKind({
  isPending,
  isError,
  error,
  hasData,
}: QueryLike): StateKind | null {
  const online = useOnline();
  if (hasData) return null;
  if (!online) return "offline";
  if (isPending) return "loading";
  if (isError) return isNetworkError(error) ? "offline" : "error";
  return null;
}
