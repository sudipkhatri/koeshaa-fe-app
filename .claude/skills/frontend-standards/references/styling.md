# Styling

One source of truth for every colour, font, size, spacing step, radius and shadow: `@keoshaa/tokens`. Change a value there and both apps follow. No hard-coded colours, spacing or font sizes anywhere else.

## Tokens

- Tokens are **semantic**, named by role, not by hue: `primary`, `onPrimary`, `background`, `surface`, `text`, `textMuted`, `border`, `success`, `danger`, `reward`, plus one colour per subject (`subject.science`, …). Components never mention a hex value or a hue name.
- Every colour token has a light and a dark value in the package. Themes switch by swapping values, never by adding `dark:` overrides in components.
- Type scale, spacing (4-point), radii, shadows and `minTouchTarget` live in the same package.
- The package exports the values once and generates what each app needs: the Tailwind theme (CSS variables) for web and the NativeWind theme for mobile. A test fails if a generated theme drifts from the package.
- Adding a token: add it to the package (light and dark), regenerate, then use the class. Never add a colour in an app's config first.

## Classes

- Both apps style with Tailwind utility classes bound to the token theme: `bg-primary`, `text-text-muted`, `p-4`, `rounded-card`. Web uses Tailwind v4 with a CSS `@theme`; mobile uses NativeWind 4 (Tailwind 3) with a JS theme object that references CSS variables. Both are generated from the tokens.
- Only theme classes. Arbitrary values (`bg-[#4F46E5]`, `p-[13px]`) in `className` literals fail lint (`no-restricted-syntax` in both apps' ESLint configs).
- When a class list repeats, extract a component, not a custom CSS class or a shared class-string constant.
- Variants (size, tone) are a small typed map inside the component (`const tone = { primary: "bg-primary", danger: "bg-danger" }`), not a styling library.

## Web

- The `@theme` in `apps/web/src/app/globals.css` is generated from the tokens; do not edit it by hand.
- Mobile-first: design at 375 px wide, then add breakpoints.

## Mobile

- NativeWind classes via `className`. Fall back to `StyleSheet.create` with token values only where a class cannot express it (animated values, measured layout), and say why in the component.
- No inline style objects created on every render for list items.
- Minimum touch target `minTouchTarget` (48) on both platforms.

## Both

- Light and dark are both designed (the approved prototype); check every new screen in both.
- Text in Nepali needs Devanagari fonts (Baloo 2) and extra line height; check every new screen in Nepali.
- Text on a coloured fill meets 4.5:1 contrast; check new token pairs when you add them.
- Icons have labels when they carry meaning (`accessibility.md`).
