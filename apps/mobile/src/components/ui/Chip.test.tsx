import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";

import { Chip } from "./Chip";

describe("Chip", () => {
  it("is plain text without onPress", async () => {
    await renderWithProviders(<Chip label="Class 7" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Class 7")).toBeOnTheScreen();
  });

  it("becomes a button that presses", async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Chip label="Class 7" variant="chip" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Class 7" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("uses the accessibility label for the button", async () => {
    await renderWithProviders(
      <Chip label="7" onPress={jest.fn()} accessibilityLabel="Choose class 7" />,
    );
    expect(screen.getByRole("button", { name: "Choose class 7" })).toBeOnTheScreen();
  });
});
