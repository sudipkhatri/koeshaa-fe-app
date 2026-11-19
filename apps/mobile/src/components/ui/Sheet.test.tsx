import { fireEvent, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { renderWithProviders } from "@/test/render";

import { Sheet } from "./Sheet";

describe("Sheet", () => {
  it("shows its title and content when visible", async () => {
    await renderWithProviders(
      <Sheet visible onClose={jest.fn()} title="Pick class">
        <Text>Body</Text>
      </Sheet>,
    );
    expect(screen.getByRole("header")).toHaveTextContent("Pick class");
    expect(screen.getByText("Body")).toBeOnTheScreen();
  });

  it("closes from the backdrop control", async () => {
    const onClose = jest.fn();
    await renderWithProviders(
      <Sheet visible onClose={onClose}>
        <Text>Body</Text>
      </Sheet>,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Android back", async () => {
    const onClose = jest.fn();
    await renderWithProviders(
      <Sheet visible onClose={onClose}>
        <Text>Body</Text>
      </Sheet>,
    );
    let node = screen.getByText("Body").parent;
    while (node && !node.props.onRequestClose) node = node.parent;
    node?.props.onRequestClose();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when hidden", async () => {
    await renderWithProviders(
      <Sheet visible={false} onClose={jest.fn()}>
        <Text>Body</Text>
      </Sheet>,
    );
    expect(screen.queryByText("Body")).toBeNull();
  });
});
