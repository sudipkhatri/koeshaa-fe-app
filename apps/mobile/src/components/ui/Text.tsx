import { fontSize, lineHeight } from "@keoshaa/tokens";
import { Text as NativeText } from "react-native";
import type { TextProps as NativeTextProps } from "react-native";

import { useLocale } from "@/lib/locale";

import { cx } from "./cx";

export type TextVariant =
  | "display"
  | "lead"
  | "headline"
  | "greeting"
  | "title"
  | "section"
  | "heading"
  | "body"
  | "small"
  | "caption";

/** Size and weight per variant. Colour is added separately so a `text-<colour>` class can replace it. */
const variantClass: Record<TextVariant, string> = {
  display: "text-display font-ui-bold",
  lead: "text-lead font-ui-bold",
  headline: "text-headline font-ui-bold",
  greeting: "text-greeting font-ui-bold",
  title: "text-title font-ui-bold",
  section: "text-section font-ui-bold",
  heading: "text-heading font-ui-bold",
  body: "text-body font-ui",
  small: "text-small font-ui",
  caption: "text-caption font-ui",
};

const variantColor: Record<TextVariant, string> = {
  display: "text-primary",
  lead: "text-text",
  greeting: "text-text",
  section: "text-text",
  headline: "text-text",
  title: "text-text",
  heading: "text-text",
  body: "text-text",
  small: "text-text-muted",
  caption: "text-text-muted",
};

/** True when the caller passed its own colour class (size and alignment classes do not count). */
const hasColorClass = (className?: string) =>
  /(^|\s)text-(on-|primary|text|background|success|danger|reward|hero|surface|border|subject)/.test(
    className ?? "",
  );

const variantSize: Record<TextVariant, number> = {
  display: fontSize.display,
  lead: fontSize.lead,
  headline: fontSize.headline,
  greeting: fontSize.greeting,
  title: fontSize.title,
  section: fontSize.section,
  heading: fontSize.heading,
  body: fontSize.body,
  small: fontSize.small,
  caption: fontSize.caption,
};

/** Headings in the prototype use tighter line heights than body copy (1.1 to 1.25). */
const headingRatio: Partial<Record<TextVariant, { en: number; ne: number }>> = {
  display: { en: 1.1, ne: 1.1 },
  lead: { en: 1.2, ne: 1.2 },
  headline: { en: 1.2, ne: 1.4 },
  greeting: { en: 1.2, ne: 1.2 },
  title: { en: 1.25, ne: 1.25 },
};

/** Line heights are fixed numbers per language (React Native needs pixels), built once. */
const lineHeightFor = (locale: "en" | "ne") =>
  Object.fromEntries(
    Object.entries(variantSize).map(([v, s]) => {
      const ratio =
        headingRatio[v as TextVariant]?.[locale] ??
        lineHeight[locale === "en" ? "latin" : "nepali"];
      return [v, { lineHeight: Math.round(s * ratio) }];
    }),
  );
const lineHeights = { en: lineHeightFor("en"), ne: lineHeightFor("ne") } as const;

export interface TextProps extends NativeTextProps {
  variant?: TextVariant;
  /** Secondary colour for supporting copy. */
  muted?: boolean;
  /** Tight 1.2 line height for headings that sit close to what follows. */
  tight?: boolean;
  className?: string;
}

export function Text({ variant = "body", muted, tight, className, style, ...rest }: TextProps) {
  const { locale } = useLocale();
  return (
    <NativeText
      className={cx(
        variantClass[variant],
        !hasColorClass(className) && (muted ? "text-text-muted" : variantColor[variant]),
        className,
      )}
      style={[
        tight
          ? { lineHeight: Math.round(variantSize[variant] * 1.2) }
          : lineHeights[locale][variant],
        style,
      ]}
      {...rest}
    />
  );
}
