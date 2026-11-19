import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";

import { Banner } from "./Banner";

describe("Banner", () => {
  it("is an alert only when it is a danger notice", async () => {
    await renderWithProviders(<Banner tone="danger">Bad</Banner>);
    expect(screen.getByText("Bad").parent?.props.accessibilityRole).toBe("alert");
  });

  it("announces a dismissible danger notice and keeps its button reachable", async () => {
    await renderWithProviders(
      <Banner tone="danger" onDismiss={() => undefined}>
        Bad
      </Banner>,
    );
    const box = screen.getByText("Bad").parent;
    expect(box?.props.accessibilityRole).toBe("alert");
    expect(box?.props.accessibilityLiveRegion).toBe("assertive");
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeOnTheScreen();
  });

  it("is not announced as an alert for neutral or success", async () => {
    await renderWithProviders(<Banner tone="success">Fine</Banner>);
    expect(screen.getByText("Fine").parent?.props.accessibilityRole).toBeUndefined();
    expect(screen.getByText("Fine")).toBeOnTheScreen();
  });

  it("dismisses through the labelled button", async () => {
    const onDismiss = jest.fn();
    await renderWithProviders(<Banner onDismiss={onDismiss}>Hi</Banner>);
    await fireEvent.press(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
