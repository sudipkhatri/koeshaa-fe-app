import { act, fireEvent, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { renderWithProviders } from "@/test/render";

import { useToast } from "./toast";

function Trigger() {
  const toast = useToast();
  return (
    <Pressable accessibilityRole="button" onPress={() => toast("Saved")}>
      <Text>go</Text>
    </Pressable>
  );
}

describe("toast", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("announces politely and disappears after a moment", async () => {
    await renderWithProviders(<Trigger />);
    await fireEvent.press(screen.getByRole("button"));
    const toast = screen.getByRole("alert");
    expect(toast).toHaveTextContent("Saved");
    expect(toast.props.accessibilityLiveRegion).toBe("polite");
    await act(async () => {
      jest.advanceTimersByTime(2400);
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
