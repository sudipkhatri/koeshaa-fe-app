# React

Applies to both apps (React 19, React Compiler enabled on mobile; check before relying on it on web).

## Components

- Function components only. One component per file for anything exported; small private helpers may share the file.
- Components render; hooks hold logic. A component over ~150 lines or with more than a few `useState`/`useEffect` calls moves logic into a hook.
- Props are typed explicitly; prefer narrow props over passing whole API objects down many levels.
- No business rules in components (who may see what, prices, eligibility): they come from the API or a tested function.

## State

| Kind                                | Where                                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| Server data                         | TanStack Query (`data-fetching.md`); never copied into `useState`                         |
| Form state                          | The form library (`forms.md`)                                                             |
| Local UI state (open, selected tab) | `useState` / `useReducer` in the component                                                |
| Session (signed-in user, tokens)    | One session provider in `lib/`                                                            |
| Cross-screen client state           | Avoid; if needed, a small context per feature. No global store until two features need it |

## Hooks and effects

- Follow the Rules of Hooks (lint enforced).
- `useEffect` only to sync with something outside React (subscriptions, timers, native APIs). Never for deriving state or for data fetching.
- Every effect that subscribes cleans up.
- Do not add `useMemo`/`useCallback` by default; the React Compiler handles most cases. Add them only with a measured reason.

## Lists and keys

- Keys are stable ids from the data, never array indexes for lists that change.
- Long lists are virtualised (`performance.md`).
