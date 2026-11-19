import { color } from "@keoshaa/tokens";
import type { ColorScheme, Palette } from "@keoshaa/tokens";
import { colorScheme, useColorScheme } from "nativewind";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { ThemePreference } from "./preferences";
import { writePreference } from "./storage";

interface ThemeValue {
  /** What the user picked: system, light or dark. */
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  /** What is actually showing. */
  scheme: ColorScheme;
  /** Token values for the showing scheme, for the few places a class cannot reach (icons, SVG). */
  colors: Palette;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({
  initial,
  children,
}: {
  initial: ThemePreference;
  children: ReactNode;
}) {
  const [preference, setPreferenceState] = useState(initial);
  const { colorScheme: resolved } = useColorScheme();

  useEffect(() => {
    colorScheme.set(preference);
  }, [preference]);

  const scheme: ColorScheme = resolved === "dark" ? "dark" : "light";
  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    void writePreference("theme", next);
  };

  return (
    <ThemeContext value={{ preference, setPreference, scheme, colors: color[scheme] }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
