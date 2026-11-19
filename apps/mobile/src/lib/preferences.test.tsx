import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { renderWithProviders } from "@/test/render";

import { useLocale } from "./locale";
import { loadPreferences } from "./preferences";

function LocaleProbe() {
  const { t, setLocale } = useLocale();
  return (
    <Pressable accessibilityRole="button" onPress={() => setLocale("ne")}>
      <Text>{t("ui.retry")}</Text>
    </Pressable>
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("locale", () => {
  it("switches language and remembers the choice", async () => {
    await renderWithProviders(<LocaleProbe />);
    expect(screen.getByText("Try again")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button"));
    expect(screen.getByText("फेरि प्रयास गर्नुहोस्")).toBeOnTheScreen();
    await act(async () => undefined);
    expect((await loadPreferences()).locale).toBe("ne");
  });
});

describe("loadPreferences", () => {
  it("defaults to the light theme and English", async () => {
    expect(await loadPreferences()).toEqual({ theme: "light", locale: "en" });
  });

  it("ignores stored values it does not know", async () => {
    await AsyncStorage.setItem("keoshaa.pref.theme", "purple");
    await AsyncStorage.setItem("keoshaa.pref.locale", "fr");
    expect(await loadPreferences()).toEqual({ theme: "light", locale: "en" });
  });

  it("restores a stored dark theme and Nepali", async () => {
    await AsyncStorage.setItem("keoshaa.pref.theme", "dark");
    await AsyncStorage.setItem("keoshaa.pref.locale", "ne");
    expect(await loadPreferences()).toEqual({ theme: "dark", locale: "ne" });
  });
});
