import { onlineManager } from "@tanstack/react-query";
import { addNetworkStateListener, getNetworkStateAsync } from "expo-network";
import { useSyncExternalStore } from "react";

const subscribe = (listener: () => void) => onlineManager.subscribe(listener);

/** Keeps TanStack Query paused while the phone has no connection and resumes when it returns. */
export function startConnectivityWatch(): () => void {
  const apply = (isConnected?: boolean, isInternetReachable?: boolean) =>
    onlineManager.setOnline(isConnected !== false && isInternetReachable !== false);
  const subscription = addNetworkStateListener((state) =>
    apply(state.isConnected, state.isInternetReachable),
  );
  void getNetworkStateAsync()
    .then((state) => apply(state.isConnected, state.isInternetReachable))
    .catch(() => undefined);
  return () => subscription.remove();
}

/** True while the phone has a connection; screens show StateView kind="offline" when false. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => onlineManager.isOnline(),
    () => true,
  );
}
