import { render, screen } from "@testing-library/react-native";

import HomeScreen from "../index";

describe("home screen", () => {
  it("shows the app name in English by default", async () => {
    await render(<HomeScreen />);
    expect(screen.getByRole("header")).toHaveTextContent("Keoshaa");
  });
});
