# Documentation

Technical docs live in `docs/` as Markdown (checked by Prettier in `npm run verify`).

## What every change updates

| Change                                                             | Update                                                                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Anything users, testers or the backend team notice                 | Entry under **Unreleased** in `docs/release-notes.md` (Added / Changed / Removed / Fixed / Security) |
| New or changed environment variable                                | `docs/reference/configuration.md` and the app's `.env.example`                                       |
| New architectural decision (library, pattern, storage, navigation) | New ADR in `docs/adr/` + index                                                                       |
| New recurring task                                                 | How-to in `docs/how-to/`                                                                             |
| New feature area                                                   | A short section in `docs/explanation/architecture.md` if it changes the structure                    |

## Writing rules

- Write for the reader's task; short sentences; commands in fenced blocks that can be copied as-is.
- One home per fact: values and defaults live in reference pages; other pages link to them.
- Release notes describe impact and required actions, not implementation. Prefix breaking changes with **BREAKING:**.
- ADRs are immutable once accepted; supersede with a new ADR.
- Never put secrets, private hostnames or personal data in docs.
- Do not duplicate the engineering standards in `docs/`; link to `.claude/skills/frontend-standards/`.
