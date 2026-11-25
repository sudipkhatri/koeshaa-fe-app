/**
 * Design tokens shared by the web and mobile apps. Brand colours are sampled from the
 * Keoshaa mark: cream field, teal letter, gold stroke. One source for colours,
 * spacing, radii, type and shadows. `scripts/generate.ts` turns them into the web `@theme` and the
 * NativeWind theme; `src/theme.test.ts` fails when a generated file drifts.
 */

const light = {
  background: "#F6EBD9",
  surface: "#FFFCF8",
  surfaceMuted: "#EFE4D2",
  /** White page behind the public web, from the design boards. */
  canvas: "#FFFFFF",
  /** Quiet section fill on the public web. */
  mist: "#F9FBFA",
  /** Hairline on white, from the design boards. */
  line: "#E8EFED",
  text: "#023330",
  textMuted: "#3E6F6C",
  /** Body copy on the public pages. */
  inkSoft: "#41615E",
  border: "#E4D5BE",
  /** Footer field from the landing board. */
  footer: "#012421",
  footerText: "#9DBAB6",
  primary: "#056B67",
  primaryPressed: "#044E4B",
  onPrimary: "#FFFFFF",
  primaryTint: "#E7F3F1",
  onPrimaryTint: "#056B67",
  /** The teal of the mark. White text on it clears 4.5:1. */
  hero: "#056B67",
  reward: "#E9AB34",
  onReward: "#3A2A04",
  rewardTint: "#F8E7C0",
  onRewardTint: "#3A2A04",
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
  grapeTint: "#F8E7C0",
  onGrapeTint: "#3A2A04",
  onSubject: "#FFFFFF",
  mascotEyes: "#023330",
  overlay: "rgba(10, 16, 40, 0.5)",
  /** Video placeholder gradient: intentionally identical in light and dark (repeated in `dark`). */
  videoFrom: "#033E3C",
  videoTo: "#056B67",
  /** Saturated fill behind white text and icons (tiles, bands). */
  subject: {
    science: "#047857",
    maths: "#1D4E89",
    english: "#C2410C",
    nepali: "#E11D48",
    social: "#0369A1",
    health: "#7C3AED",
  },
  /** Same hue as readable text or icon on a tint. */
  subjectText: {
    science: "#047857",
    maths: "#1D4E89",
    english: "#C2410C",
    nepali: "#BE123C",
    social: "#0369A1",
    health: "#6D28D9",
  },
  /** Staff and school portal palette, from the admin design boards. */
  admin: {
    page: "#F4F7F6",
    surface: "#FFFFFF",
    subtle: "#FAFBFB",
    border: "#DDE5E3",
    rule: "#EEF2F1",
    ink: "#0E2E2B",
    soft: "#456B68",
    faint: "#7A9794",
    hint: "#9FBAB6",
    quiet: "#3F5B58",
    onTint: "#04524F",
    danger: "#BE123C",
    note: "#FFF8EC",
    noteLine: "#F0DFC0",
    dashed: "#BFD0CC",
    dangerLine: "#FBD0D8",
    dangerSoft: "#FFF5F6",
  },
};

export type Palette = typeof light;

const dark: Palette = {
  background: "#072421",
  surface: "#0E3330",
  surfaceMuted: "#143E3A",
  canvas: "#0E3330",
  mist: "#143E3A",
  line: "#1E4A46",
  text: "#F6EBD9",
  textMuted: "#C9DDD6",
  inkSoft: "#C9DDD6",
  border: "#1E4A46",
  footer: "#012421",
  footerText: "#9DBAB6",
  primary: "#0A7A74",
  primaryPressed: "#056B67",
  onPrimary: "#FFFFFF",
  primaryTint: "#143E3A",
  onPrimaryTint: "#B7E4DF",
  /** Same teal as the mark so white text on the band keeps contrast. */
  hero: "#056B67",
  reward: "#E9AB34",
  onReward: "#3A2A04",
  rewardTint: "#3A2A04",
  onRewardTint: "#F8E7C0",
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
  grapeTint: "#3A2A04",
  onGrapeTint: "#F8E7C0",
  onSubject: "#FFFFFF",
  mascotEyes: "#023330",
  overlay: "rgba(10, 16, 40, 0.5)",
  // Same as light on purpose (see above); onSubject, mascotEyes and overlay repeat for the same reason.
  videoFrom: "#033E3C",
  videoTo: "#056B67",
  subject: {
    science: "#065F46",
    maths: "#1E3A6E",
    english: "#9A3412",
    nepali: "#BE123C",
    social: "#075985",
    health: "#6D28D9",
  },
  subjectText: {
    science: "#6EE7B7",
    maths: "#A9C4F0",
    english: "#FDBA74",
    nepali: "#FDA4AF",
    social: "#7DD3FC",
    health: "#C4B5FD",
  },
  admin: {
    page: "#072421",
    surface: "#0E3330",
    subtle: "#123A36",
    border: "#1E4A46",
    rule: "#18403C",
    ink: "#E6F0EE",
    soft: "#A9C4C0",
    faint: "#86A6A2",
    hint: "#6E8F8B",
    quiet: "#C9DDD6",
    onTint: "#B7E4DF",
    danger: "#FDA4AF",
    note: "#3A2A04",
    noteLine: "#5A4310",
    dashed: "#2C5A55",
    dangerLine: "#6B2436",
    dangerSoft: "#3A1621",
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
  badge: 10,
  tag: 11,
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
  light: "0 2px 0 rgba(2, 51, 48, 0.06), 0 8px 24px rgba(2, 51, 48, 0.08)",
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
