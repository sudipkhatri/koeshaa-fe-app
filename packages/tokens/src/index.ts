/**
 * Design tokens shared by the web and mobile apps ("Playful Indigo"): one source for colours,
 * spacing, radii, type and shadows. `scripts/generate.ts` turns them into the web `@theme` and the
 * NativeWind theme; `src/theme.test.ts` fails when a generated file drifts.
 */

const light = {
  background: "#F5F6FB",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF0F8",
  text: "#1B1F3B",
  textMuted: "#5A6080",
  border: "#E6E8F2",
  primary: "#4F46E5",
  primaryPressed: "#4338CA",
  onPrimary: "#FFFFFF",
  primaryTint: "#E9E8FE",
  onPrimaryTint: "#4338CA",
  /** Intentionally equal to `primary` in light: the hero band is its own role so it can diverge. */
  hero: "#4F46E5",
  reward: "#FFC83D",
  onReward: "#4A3500",
  rewardTint: "#FFF0C2",
  onRewardTint: "#4A3500",
  success: "#10B981",
  successTint: "#D9F6EA",
  onSuccessTint: "#065F46",
  danger: "#F43F5E",
  dangerTint: "#FFE4E8",
  onDangerTint: "#9F1239",
  dangerFill: "#E11D48",
  onDangerFill: "#FFFFFF",
  skyTint: "#E0F2FE",
  onSkyTint: "#075985",
  grapeTint: "#EDE8FE",
  onGrapeTint: "#5B21B6",
  onSubject: "#FFFFFF",
  mascotEyes: "#14173A",
  overlay: "rgba(10, 16, 40, 0.5)",
  /** Video placeholder gradient: intentionally identical in light and dark (repeated in `dark`). */
  videoFrom: "#312E81",
  videoTo: "#4F46E5",
  /** Saturated fill behind white text and icons (tiles, bands). */
  subject: {
    science: "#047857",
    maths: "#4F46E5",
    english: "#C2410C",
    nepali: "#E11D48",
    social: "#0369A1",
    health: "#7C3AED",
  },
  /** Same hue as readable text or icon on a tint. */
  subjectText: {
    science: "#047857",
    maths: "#4338CA",
    english: "#C2410C",
    nepali: "#BE123C",
    social: "#0369A1",
    health: "#6D28D9",
  },
};

export type Palette = typeof light;

const dark: Palette = {
  background: "#0F1222",
  surface: "#1A1E35",
  surfaceMuted: "#232845",
  text: "#F1F2FF",
  textMuted: "#A9AECB",
  border: "#2B3050",
  primary: "#818CF8",
  primaryPressed: "#6F7BF0",
  onPrimary: "#12153A",
  primaryTint: "#2A2E66",
  onPrimaryTint: "#A5B0FF",
  /** Darker than `primary` in dark so white text on the band keeps contrast. */
  hero: "#4338CA",
  reward: "#FFC83D",
  onReward: "#4A3500",
  rewardTint: "#4A3A0E",
  onRewardTint: "#FFDC80",
  success: "#34D399",
  successTint: "#0F3D31",
  onSuccessTint: "#6EE7B7",
  danger: "#FB7185",
  dangerTint: "#4A1B2A",
  onDangerTint: "#FDA4AF",
  dangerFill: "#FB7185",
  onDangerFill: "#4C0519",
  skyTint: "#0C3550",
  onSkyTint: "#7DD3FC",
  grapeTint: "#35296E",
  onGrapeTint: "#D4C8FF",
  onSubject: "#FFFFFF",
  mascotEyes: "#14173A",
  overlay: "rgba(10, 16, 40, 0.5)",
  // Same as light on purpose (see above); onSubject, mascotEyes and overlay repeat for the same reason.
  videoFrom: "#312E81",
  videoTo: "#4F46E5",
  subject: {
    science: "#065F46",
    maths: "#4338CA",
    english: "#9A3412",
    nepali: "#BE123C",
    social: "#075985",
    health: "#6D28D9",
  },
  subjectText: {
    science: "#6EE7B7",
    maths: "#A5B4FC",
    english: "#FDBA74",
    nepali: "#FDA4AF",
    social: "#7DD3FC",
    health: "#C4B5FD",
  },
};

export const color = { light, dark } as const;

export type ColorScheme = keyof typeof color;
export type SubjectId = keyof Palette["subject"];

/** 4-point scale. Tailwind's default spacing classes (`p-4` = 16) follow the same scale. */
export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64] as const;

/** `card` is 24 and `sheet` 28 in the prototype; `full` is a pill. */
export const radius = {
  sm: 8,
  square: 10,
  md: 12,
  tile: 14,
  lg: 16,
  cell: 18,
  xl: 20,
  card: 24,
  sheet: 28,
  band: 32,
  piece: 3,
  full: 9999,
} as const;

/** Fixed control and tile heights from the prototype that the 4-point scale cannot express (52, 60, 88, 152). */
export const size = {
  button: 52,
  row: 60,
  search: 60,
  codeBox: 60,
  play: 68,
  toggle: 52,
  option: 88,
  tile: 152,
} as const;

/** Sorted by size; names are roles from the prototype. */
export const fontSize = {
  micro: 12,
  caption: 13,
  small: 14,
  body: 16,
  button: 17,
  section: 18,
  choice: 19,
  heading: 20,
  title: 22,
  greeting: 24,
  lead: 26,
  headline: 28,
  avatar: 30,
  timer: 32,
  display: 44,
} as const;

/** Line height as a multiple of the font size; Devanagari needs more room. */
export const lineHeight = { latin: 1.4, nepali: 1.6 } as const;

/** Baloo 2 weights as loaded by `@expo-google-fonts/baloo-2` (one family name per weight). */
export const fontFamily = {
  regular: "Baloo2_400Regular",
  medium: "Baloo2_500Medium",
  semibold: "Baloo2_600SemiBold",
  bold: "Baloo2_700Bold",
} as const;

/** Soft two-layer card shadow from the prototype; the dark scheme uses a stronger black. */
export const shadow = {
  light: "0 2px 0 rgba(30, 34, 70, 0.06), 0 8px 24px rgba(30, 34, 70, 0.06)",
  dark: "0 2px 0 rgba(0, 0, 0, 0.25), 0 8px 24px rgba(0, 0, 0, 0.3)",
} as const;

/** Minimum touch target (accessibility). */
export const minTouchTarget = 48;

/** Flat colour names (the nested `subject` groups are read as `colors.subject.science`). */
export type ColorToken = {
  [K in keyof Palette]: Palette[K] extends string ? K : never;
}[keyof Palette];

/** Keys of a generated-file map, shared by the generator and the drift tests. */
export type GeneratedTarget = "webTheme" | "mobileCss" | "mobileTailwindTheme";
