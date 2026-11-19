import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";

import { TextField } from "./TextField";

describe("TextField", () => {
  it("labels the input and reports typing", async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(<TextField label="Email" value="" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText("Email"), "a@b.com");
    expect(onChangeText).toHaveBeenCalledWith("a@b.com");
  });

  it("shows the error as an alert and exposes it as the input hint", async () => {
    await renderWithProviders(<TextField label="Email" error="Enter a valid email address." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address.");
    expect(screen.getByLabelText("Email").props.accessibilityHint).toBe(
      "Enter a valid email address.",
    );
  });

  it("hides the password until the user shows it", async () => {
    await renderWithProviders(<TextField label="Password" secureTextEntry value="secret" />);
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(true);
  });

  it("shows the phone prefix", async () => {
    await renderWithProviders(<TextField label="Mobile number" prefix="+977" />);
    expect(screen.getByText("+977")).toBeOnTheScreen();
  });

  it("labels the show-password control in Nepali", async () => {
    await renderWithProviders(<TextField label="पासवर्ड" secureTextEntry />, { locale: "ne" });
    expect(screen.getByRole("button", { name: "पासवर्ड देखाउनुहोस्" })).toBeOnTheScreen();
  });
});
