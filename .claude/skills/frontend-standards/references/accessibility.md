# Accessibility

Target: WCAG 2.2 AA on the web; the equivalent platform guidelines on Android and iOS. Students include young children and shared family phones.

## Rules

- Every interactive element has an accessible name (visible label, `aria-label`, or `accessibilityLabel`) and the right role (`button`, `link`, `header`, `checkbox`…).
- Use real elements on the web (`button`, `a`, `label`, `input`); on mobile set `accessibilityRole`.
- Keyboard: everything reachable and operable by keyboard on the web, with a visible focus ring; focus moves to the new content after navigation and into dialogs while open.
- Colour contrast at least 4.5:1 for text (3:1 for large text and UI parts); never colour alone to carry meaning (wrong answers also get an icon or text).
- Touch targets at least 44×44.
- Text scales: web supports 200% zoom without loss; mobile respects system font size.
- Errors are announced: link field errors to inputs (`aria-describedby`, `accessibilityHint`) and announce form-level errors.
- Motion: respect reduced-motion settings for animations in games and transitions.
- Media: videos have captions; images that carry information have alt text.
- Tests query by role and label (`getByRole`, `getByLabelText`), which checks accessibility as a side effect.
