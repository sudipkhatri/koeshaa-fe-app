@AGENTS.md

## Mandatory workflow for every task

Applies to any task that touches `apps/`, `packages/`, root config or CI. Do not skip steps because a task looks small.

1. **Load standards first.** Invoke the `frontend-standards` skill before reading or changing code, then read only the `references/*.md` files its table lists for this change. These standards are binding; `AGENTS.md` non-negotiables win on conflict.
2. **Read the framework docs** for every Next.js or Expo API you will use, from the installed version (non-negotiable 1).
3. **Clarify.** If product requirements are ambiguous, ask before building. Do not invent screens or flows.
4. **Plan.** Use Plan mode for new features, new screens with server data, or work spanning more than ~3 files. State which standards apply.
5. **Use the right skill.** New feature or screen → `new-feature`. Backend API changed → `update-api-client`.
6. **Implement** in layers (types and schemas → API hooks → components → route or screen), small diffs, no unrelated refactors.
7. **Test (mandatory).** Every behaviour change ships with tests per `references/testing.md`; every bug fix gets a regression test. Use the `test-writer` agent when helpful.
8. **Verify and measure.** `npm run verify` must be green. Never weaken tests to pass. Measure anything that affects load size, startup, rendering of long lists or a new dependency per `references/performance.md` and include the numbers in the report.
9. **Document.** Update the affected docs and add an **Unreleased** entry to `docs/release-notes.md` per `references/documentation.md`; use the `docs-writer` agent when helpful.
10. **Review is manual.** Never start a review yourself. The developer runs `/review` (our scored review via the `code-reviewer` agent) when they choose. When they share findings, fix them; the bar for merge is verdict **Approve** per `references/review.md`.
11. **Report.** Summarise what changed, verify and measurement results, and anything skipped or unverified, and remind the developer that the change is ready for their review. Never claim something passed that was not run.

## Changing the standards

The `frontend-standards` skill is a fixed set of files. Do not create new skills, reference files or agents on your own. Put new conventions into the existing reference that fits, and only when the developer agrees. Propose a new file only when no existing one fits, and wait for approval.

## Claude Code specifics

- Mobile dependencies only through `npx expo install` (from `apps/mobile`).
- Do not commit or push unless asked.
