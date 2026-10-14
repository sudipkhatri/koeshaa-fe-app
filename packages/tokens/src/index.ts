/**
 * Design tokens shared by the web and mobile apps: one source for colours, spacing, radii and
 * type. The web maps them to CSS variables (`apps/web/src/app/globals.css`, checked by a test);
 * mobile uses them directly in `StyleSheet`. Values are placeholders until the design system
 * lands.
 */

export const color = {
  brand: "#1D4ED8",
  brandOn: "#FFFFFF",
  text: "#111827",
  textMuted: "#4B5563",
  background: "#FFFFFF",
  surface: "#F3F4F6",
  border: "#E5E7EB",
  success: "#15803D",
  warning: "#B45309",
  danger: "#B91C1C",
} as const;

/** 4-point scale; index by step, e.g. `space[4]` = 16. */
export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64] as const;

export const radius = { sm: 4, md: 8, lg: 16, full: 9999 } as const;

export const fontSize = { sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 } as const;

/** Minimum touch target (accessibility). */
export const minTouchTarget = 44;

export type ColorToken = keyof typeof color;
