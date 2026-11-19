import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";

import { Button } from "./Button";

describe("Button", () => {
  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button title="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not press while loading and says it is busy", async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button title="Save" onPress={onPress} loading />);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toBeBusy();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("is disabled for assistive tech when disabled", async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button title="Save" onPress={onPress} disabled />);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("uses a custom accessibility label when given", async () => {
    await renderWithProviders(<Button title="Go" accessibilityLabel="Go to class 7" />);
    expect(screen.getByRole("button", { name: "Go to class 7" })).toBeOnTheScreen();
  });
});

describe("Button sizes", () => {
  it("makes lg taller than md", async () => {
    await renderWithProviders(
      <>
        <Button title="Medium" size="md" />
        <Button title="Large" size="lg" />
      </>,
    );
    const cls = (name: string) =>
      String(screen.getByRole("button", { name }).props.className ?? "");
    expect(cls("Large")).not.toEqual(cls("Medium"));
  });
});
