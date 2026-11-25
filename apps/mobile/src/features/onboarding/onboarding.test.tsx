import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { resetMockAuth } from "@/features/auth/api";

import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";

import { CodeScreen } from "./CodeScreen";
import { SignInScreen } from "./SignInScreen";
import { SignupNameScreen } from "./SignupNameScreen";
import { ageFrom, kindOf, maskContact, passwordScore } from "./rules";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

beforeEach(() => jest.clearAllMocks());

async function signIn(id: string, password: string) {
  await renderWithProviders(<SignInScreen />);
  await fireEvent.changeText(screen.getByLabelText("Phone, email or username"), id);
  await fireEvent.changeText(screen.getByLabelText("Password"), password);
  await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
}

describe("sign in", () => {
  beforeEach(resetMockAuth);

  it("asks for both boxes", async () => {
    await signIn("", "");
    expect(await screen.findByText("Add your phone, email or username.")).toBeTruthy();
  });

  it("shows a friendly message for a wrong password", async () => {
    await signIn("aarav", "nope-nope");
    expect(await screen.findByText(/That did not match/)).toBeTruthy();
  });

  it("pauses sign in after five wrong passwords", async () => {
    await renderWithProviders(<SignInScreen />);
    await fireEvent.changeText(screen.getByLabelText("Phone, email or username"), "aarav");
    await fireEvent.changeText(screen.getByLabelText("Password"), "nope-nope");
    for (let i = 0; i < 4; i++) {
      await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
      await screen.findByText(/That did not match/);
    }
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Let's take a short break")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Demo: skip the wait" }));
    expect(screen.getByText("Welcome back")).toBeTruthy();
  });

  it("sends the code to a parent for a username", async () => {
    await signIn("aarav", "keoshaa123");
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith({
        pathname: "/onboarding/code",
        params: { to: "+977 ••••", child: "1", next: "signed-in", step: "code" },
      }),
    );
  });

  it("signs a known device in without a code", async () => {
    await signIn("sita", "keoshaa123");
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/home"));
  });
});

describe("code entry", () => {
  beforeEach(resetMockAuth);

  it("rejects a wrong code, then accepts 123456", async () => {
    await renderWithProviders(<CodeScreen to="a•••@x.com" toParent={false} next="signed-in" />);
    for (const [i, digit] of [..."111111"].entries())
      await fireEvent.changeText(screen.getByLabelText(`Digit ${i + 1}`), digit);
    expect(await screen.findByText(/That code is not right/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Digit 1"), "123456");
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/home"));
  });

  it("shows the rate limit after three wrong codes", async () => {
    await renderWithProviders(<CodeScreen to="x" toParent next="signed-in" />);
    for (let t = 0; t < 3; t++)
      await fireEvent.changeText(screen.getByLabelText("Digit 1"), "999999");
    expect(await screen.findByText("Too many tries")).toBeTruthy();
  });
});

describe("create account", () => {
  async function fill(year: string) {
    await renderWithProviders(<SignupNameScreen />);
    await fireEvent.changeText(screen.getByLabelText("What should we call you?"), "Mina");
    await fireEvent.press(screen.getByRole("button", { name: "Day" }));
    await fireEvent.press(screen.getByRole("button", { name: "1" }));
    await fireEvent.press(screen.getByRole("button", { name: "Month" }));
    await fireEvent.press(screen.getByRole("button", { name: "January" }));
    await fireEvent.press(screen.getByRole("button", { name: "Year" }));
    await fireEvent.press(screen.getByRole("button", { name: year }));
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
  }

  it("sends a learner under 13 to the parent screen", async () => {
    await fill("2020");
    expect(routerMock.push).toHaveBeenCalledWith("/onboarding/under-13");
  });

  it("lets an older learner continue", async () => {
    await fill("2008");
    expect(routerMock.push).toHaveBeenCalledWith("/onboarding/signup-contact");
  });
});

describe("rules", () => {
  it("recognises contact kinds and masks them", () => {
    expect(kindOf("a@b.com")).toBe("email");
    expect(kindOf("9812345621")).toBe("phone");
    expect(kindOf("aarav")).toBe("user");
    expect(maskContact("9812345621", "phone")).toBe("+977 98••••21");
  });

  it("scores passwords", () => {
    expect(passwordScore("")).toBe(0);
    expect(passwordScore("abc")).toBe(1);
    expect(passwordScore("Abcdefg1")).toBe(2);
    expect(passwordScore("Abcdefg1!xyz")).toBe(3);
  });

  it("works out age from a birthday", () => {
    expect(ageFrom(2013, 6, 1, new Date(2026, 5, 1))).toBe(13);
    expect(ageFrom(2013, 6, 2, new Date(2026, 5, 1))).toBe(12);
  });
});
