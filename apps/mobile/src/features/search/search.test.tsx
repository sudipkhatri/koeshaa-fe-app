import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";

import { getSubjects } from "@/features/learn/mock";

import { SearchScreen } from "./SearchScreen";
import { editDistance, searchChapters } from "./search";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

describe("search logic", () => {
  it("groups matches by subject and marks locked chapters", () => {
    const { groups } = searchChapters("fraction", getSubjects());
    expect(groups).toHaveLength(1);
    expect(groups[0]?.hits[0]?.locked).toBe(false);
  });

  it("suggests a close spelling when nothing matches", () => {
    expect(searchChapters("fotosynthesis", getSubjects()).suggestion).toBe("photosynthesis");
    expect(editDistance("cat", "cut")).toBe(1);
  });
});

describe("Search screen", () => {
  it("shows recent and popular searches before typing", async () => {
    await renderWithProviders(<SearchScreen />);
    expect(screen.getByText("Recent searches")).toBeTruthy();
    expect(await screen.findByText("Popular in Class 7")).toBeTruthy();
  });

  it("offers did-you-mean for a misspelling and applies it", async () => {
    await renderWithProviders(<SearchScreen />);
    await fireEvent.changeText(screen.getByLabelText("Search"), "fotosynthesis");
    expect(screen.getByText("Nothing found yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /Did you mean photosynthesis/ }));
    expect(screen.getByDisplayValue("photosynthesis")).toBeTruthy();
    expect(screen.queryByText("Nothing found yet")).toBeNull();
  });

  it("opens a locked result as a coming-soon sheet", async () => {
    await renderWithProviders(<SearchScreen />);
    await fireEvent.changeText(screen.getByLabelText("Search"), "heat");
    await fireEvent.press(screen.getByRole("button", { name: /Heat/ }));
    expect(screen.getByText("Unlock with a plan, coming soon")).toBeTruthy();
  });

  it("asks the learner to slow down after typing very fast", async () => {
    await renderWithProviders(<SearchScreen />);
    const field = screen.getByLabelText("Search");
    for (let i = 0; i < 11; i++) await fireEvent.changeText(field, "a".repeat(i + 1));
    expect(screen.getByText("Slow down a little")).toBeTruthy();
  });
});
