import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";

import { ListRow } from "./ListRow";

describe("ListRow", () => {
  it("is not a button without onPress", async () => {
    await renderWithProviders(<ListRow title="Language" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("speaks title and subtitle and presses", async () => {
    const onPress = jest.fn();
    await renderWithProviders(<ListRow title="Language" subtitle="English" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Language, English" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
