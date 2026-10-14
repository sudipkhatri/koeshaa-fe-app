# Styling

One set of design tokens (`@keoshaa/tokens`) for both apps. No hard-coded colours, spacing or font sizes in components.

## Web

- Tailwind v4. The theme in `apps/web/src/app/globals.css` (`@theme`) mirrors the tokens; `src/lib/tokens.test.ts` fails if they drift. Add a token to the package first, then to the theme.
- Utility classes in components; extract a component, not a custom CSS class, when a pattern repeats.
- Mobile-first: design at 375 px wide, then add breakpoints.

## Mobile

- `StyleSheet.create` with values from tokens (`color.brand`, `space[4]`, `fontSize.lg`).
- No inline style objects created on every render for list items.
- Minimum touch target `minTouchTarget` (44) on both platforms.

## Both

- Dark mode is not designed yet; do not add half-supported dark styles.
- Text in Nepali needs Devanagari fonts and extra line height; check every new screen in Nepali.
- Icons have labels when they carry meaning (`accessibility.md`).
