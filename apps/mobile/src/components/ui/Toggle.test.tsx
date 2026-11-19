import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";

import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("is a switch that reports its state", async () => {
    await renderWithProviders(
      <Toggle value accessibilityLabel="Sound" onValueChange={jest.fn()} />,
    );
    expect(screen.getByRole("switch", { name: "Sound" })).toBeChecked();
  });

  it("asks for the opposite value when pressed", async () => {
    const onValueChange = jest.fn();
    await renderWithProviders(
      <Toggle value={false} accessibilityLabel="Sound" onValueChange={onValueChange} />,
    );
    const toggle = screen.getByRole("switch", { name: "Sound" });
    expect(toggle).not.toBeChecked();
    await fireEvent.press(toggle);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
