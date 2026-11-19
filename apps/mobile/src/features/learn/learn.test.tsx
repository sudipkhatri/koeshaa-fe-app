import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "@/test/render";
import { routerMock } from "@/test/router-mock";

import { LearnScreen } from "./LearnScreen";
import { SubjectScreen } from "./SubjectScreen";
import { chapterStatus, parseChapterRef, subjectPercent } from "./progress";
import { getSubject } from "./mock";

jest.mock("expo-router", () => ({ router: jest.requireActual("@/test/router-mock").routerMock }));

beforeEach(() => jest.clearAllMocks());

describe("Learn", () => {
  it("opens a subject from the grid", async () => {
    await renderWithProviders(<LearnScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: /Science/ }));
    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: "/learn/subject/[id]",
      params: { id: "science" },
    });
  });

  it("shows subjects in Nepali", async () => {
    await renderWithProviders(<LearnScreen />, { locale: "ne" });
    expect(await screen.findByRole("button", { name: /विज्ञान/ })).toBeTruthy();
  });
});

describe("Subject", () => {
  it("opens a free chapter", async () => {
    await renderWithProviders(<SubjectScreen id="maths" />);
    await fireEvent.press(await screen.findByRole("button", { name: /Fractions/ }));
    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: "/learn/chapter/[ref]",
      params: { ref: "maths:0" },
    });
  });

  it("explains that a locked chapter is coming soon instead of opening it", async () => {
    await renderWithProviders(<SubjectScreen id="maths" />);
    await fireEvent.press(await screen.findByRole("button", { name: /Ratio and proportion/ }));
    expect(screen.getByText("Unlock with a plan, coming soon")).toBeTruthy();
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});

describe("progress", () => {
  it("derives chapter states and percentages", () => {
    const maths = getSubject("maths")!;
    expect(chapterStatus(maths, 0)).toBe("inProgress");
    expect(chapterStatus(maths, 1)).toBe("free");
    expect(chapterStatus(maths, 2)).toBe("locked");
    expect(subjectPercent(maths)).toBe(7);
    expect(chapterStatus(getSubject("science")!, 0)).toBe("done");
  });

  it("parses chapter references", () => {
    expect(parseChapterRef("maths:3")).toEqual({ subjectId: "maths", index: 3 });
    expect(parseChapterRef("nonsense")).toBeNull();
  });
});
