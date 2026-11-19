import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";

import { LegalScreen } from "./LegalScreen";
import { SettingsScreen } from "./SettingsScreen";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

describe("Settings", () => {
  it("switches the language to Nepali", async () => {
    await renderWithProviders(<SettingsScreen />);
    await fireEvent.press(screen.getByRole("radio", { name: "नेपाली" }));
    expect(await screen.findByText("भाषा")).toBeTruthy();
  });

  it("toggles a notification", async () => {
    await renderWithProviders(<SettingsScreen />);
    const toggle = screen.getByLabelText("Updates for my parent");
    await fireEvent(toggle, "valueChange", true);
    expect(screen.getByLabelText("Updates for my parent").props.accessibilityState.checked).toBe(
      true,
    );
  });
});

describe("Legal", () => {
  it("shows the Terms summary in a sheet", async () => {
    await renderWithProviders(<LegalScreen />);
    await fireEvent.press(screen.getByRole("button", { name: /Terms of Use/ }));
    expect(await screen.findByText("Got it")).toBeTruthy();
  });
});
