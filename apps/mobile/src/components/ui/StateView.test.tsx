import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";

import { StateView } from "./StateView";

describe("StateView", () => {
  it("shows a busy loading placeholder", async () => {
    await renderWithProviders(<StateView kind="loading" />);
    expect(screen.getByRole("progressbar", { name: "Loading" })).toBeBusy();
  });

  it("explains an empty list and offers the given action", async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <StateView kind="empty" action={{ title: "Browse free chapters", onPress }} />,
    );
    expect(screen.getByRole("header")).toHaveTextContent("Nothing here yet");
    await fireEvent.press(screen.getByRole("button", { name: "Browse free chapters" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("retries from the no connection state", async () => {
    const onRetry = jest.fn();
    await renderWithProviders(<StateView kind="offline" onRetry={onRetry} />);
    expect(screen.getByRole("header")).toHaveTextContent("No connection");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("retries from the error state, in Nepali when chosen", async () => {
    const onRetry = jest.fn();
    await renderWithProviders(<StateView kind="error" onRetry={onRetry} />, { locale: "ne" });
    expect(screen.getByRole("header")).toHaveTextContent("ओहो, यो हाम्रो गल्ती हो");
    await fireEvent.press(screen.getByRole("button", { name: "फेरि प्रयास गर्नुहोस्" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("has no retry button when nothing can be retried", async () => {
    await renderWithProviders(<StateView kind="error" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
