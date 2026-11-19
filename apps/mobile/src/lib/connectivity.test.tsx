import { onlineManager } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";

import { startConnectivityWatch, useOnline } from "./connectivity";

type Listener = (state: { isConnected?: boolean; isInternetReachable?: boolean }) => void;

const mockNetwork = {
  listener: null as Listener | null,
  remove: jest.fn(),
  initial: { isConnected: true, isInternetReachable: true },
};

jest.mock("expo-network", () => ({
  getNetworkStateAsync: async () => mockNetwork.initial,
  addNetworkStateListener: (listener: Listener) => {
    mockNetwork.listener = listener;
    return { remove: mockNetwork.remove };
  },
}));

afterEach(() => {
  onlineManager.setOnline(true);
  mockNetwork.initial = { isConnected: true, isInternetReachable: true };
});

describe("connectivity", () => {
  it("pauses and resumes the query client as the phone loses and regains a connection", async () => {
    const stop = startConnectivityWatch();
    await act(async () => undefined);
    await act(async () =>
      mockNetwork.listener?.({ isConnected: false, isInternetReachable: false }),
    );
    expect(onlineManager.isOnline()).toBe(false);
    await act(async () => mockNetwork.listener?.({ isConnected: true, isInternetReachable: true }));
    expect(onlineManager.isOnline()).toBe(true);
    stop();
    expect(mockNetwork.remove).toHaveBeenCalled();
  });

  it("treats a connected phone without internet as offline", async () => {
    const stop = startConnectivityWatch();
    await act(async () => undefined);
    await act(async () =>
      mockNetwork.listener?.({ isConnected: true, isInternetReachable: false }),
    );
    expect(onlineManager.isOnline()).toBe(false);
    stop();
  });

  it("reads the starting state", async () => {
    mockNetwork.initial = { isConnected: false, isInternetReachable: false };
    const stop = startConnectivityWatch();
    await act(async () => undefined);
    expect(onlineManager.isOnline()).toBe(false);
    stop();
  });

  it("useOnline follows the listener", async () => {
    const stop = startConnectivityWatch();
    const { result } = await renderHook(() => useOnline());
    expect(result.current).toBe(true);
    await act(async () => mockNetwork.listener?.({ isConnected: false }));
    expect(result.current).toBe(false);
    await act(async () => mockNetwork.listener?.({ isConnected: true }));
    expect(result.current).toBe(true);
    stop();
  });
});
