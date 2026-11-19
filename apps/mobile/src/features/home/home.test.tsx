import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";

import { HomeScreen } from "./HomeScreen";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

describe("Home", () => {
  it("shows the loading skeleton first, then the content", async () => {
    await renderWithProviders(<HomeScreen />);
    expect(screen.queryByText("Your subjects")).toBeNull();
    expect(await screen.findByText("Your subjects")).toBeTruthy();
    expect(screen.getByText("Namaste, Aarav")).toBeTruthy();
  });

  it("dismisses the device notice", async () => {
    await renderWithProviders(<HomeScreen />);
    expect(await screen.findByText(/Signed in on 3 of 3 devices/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.queryByText(/Signed in on 3 of 3 devices/)).toBeNull());
  });

  it("greets in Nepali", async () => {
    await renderWithProviders(<HomeScreen />, { locale: "ne" });
    expect(await screen.findByText("नमस्ते, Aarav")).toBeTruthy();
  });
});
