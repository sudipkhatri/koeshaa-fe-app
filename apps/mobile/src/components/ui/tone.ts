import type { ColorToken } from "@keoshaa/tokens";

export type Tone =
  "surface" | "primary" | "reward" | "success" | "danger" | "sky" | "grape" | "neutral";

/** Tinted box and its readable ink, shared by Chip and ListRow. Class names stay literal for Tailwind. */
export const toneStyle: Record<Tone, { box: string; text: string; ink: ColorToken }> = {
  surface: { box: "bg-surface", text: "text-text", ink: "text" },
  primary: { box: "bg-primary-tint", text: "text-on-primary-tint", ink: "onPrimaryTint" },
  reward: { box: "bg-reward", text: "text-on-reward", ink: "onReward" },
  success: { box: "bg-success-tint", text: "text-on-success-tint", ink: "onSuccessTint" },
  danger: { box: "bg-danger-tint", text: "text-on-danger-tint", ink: "onDangerTint" },
  sky: { box: "bg-sky-tint", text: "text-on-sky-tint", ink: "onSkyTint" },
  grape: { box: "bg-grape-tint", text: "text-on-grape-tint", ink: "onGrapeTint" },
  neutral: { box: "bg-surface-muted", text: "text-text-muted", ink: "textMuted" },
};
