# Code review scorecard

The only official review. Developers run it with `/review` (which uses the `code-reviewer` agent); it is never run automatically as part of a task. It covers both apps, the shared packages, tests, CI and docs, checking each against the matching standard. Large changes (more than 15 files or 800 changed lines, generated `schema.ts` and lockfiles excluded) are split by area across parallel reviewers and merged into one scorecard: each dimension takes the lowest shard score, and the gates apply to the merged result.

Every review scores all dimensions below. Do not rewrite the feature during review; list concrete fixes. Prefer the simplest correct design over pattern compliance.

## Dimensions and weights

| #   | Dimension              | Weight | What is assessed                                                                                                                                                     |
| --- | ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Correctness            | 15     | Does what the spec asks; edge cases (empty, long Nepali text, duplicate taps, slow and failed requests); navigation and back behaviour; matches the backend contract |
| 2   | Security               | 15     | Token storage per `security.md`; no secrets in public env vars; validated params and deep links; no unsafe HTML; no PII in logs; UI never the only permission check  |
| 3   | Test coverage          | 12     | Required tests from `testing.md`; loading/empty/error/offline states tested; regression test for bug fixes; `npm run verify` green                                   |
| 4   | Accessibility          | 10     | Roles, names, focus, contrast, touch targets, font scaling, announced errors (`accessibility.md`)                                                                    |
| 5   | Performance            | 10     | Budgets in `performance.md`; bundle impact of new dependencies; virtualised lists; image sizing; no waterfalls; numbers given for hot paths                          |
| 6   | UX states & resilience | 10     | Loading, empty, error, no-connection and rate-limited states; no double submit; input kept on failure; offline behaviour per `offline.md`                            |
| 7   | Architecture           | 8      | Import boundaries (apps ↔ packages), feature folders, thin routes, server/client component split, data through TanStack Query and the generated client               |
| 8   | Error handling         | 6      | `ApiError`/`NetworkError` handled by code; error boundaries; nothing swallowed                                                                                       |
| 9   | Maintainability        | 5      | Clear names; complete types, no `any`; small components; file size limits; docs and release notes per `documentation.md`                                             |
| 10  | i18n                   | 4      | Every string from `@keoshaa/i18n` in Nepali and English; no concatenation; locale-aware formatting                                                                   |
| 11  | SOLID / DRY            | 3      | Single responsibility; duplication vs premature extraction balanced; tokens instead of hard-coded styles                                                             |
| 12  | Observability          | 2      | Unexpected errors reported with context; request ids surfaced; no sensitive data                                                                                     |

Weights total 100.

## Scoring each dimension (0–10)

| Score | Meaning                                                                                |
| ----- | -------------------------------------------------------------------------------------- |
| 10    | Exemplary; nothing to improve                                                          |
| 8–9   | Solid; only nits                                                                       |
| 6–7   | Acceptable; has "should fix" items                                                     |
| 4–5   | Weak; real defects or notable risk                                                     |
| 0–3   | Broken or dangerous; blocker present                                                   |
| N/A   | Not touched by this change (e.g. no UI). Excluded; remaining weights are re-normalised |

Re-normalising over applicable weights is allowed only when at least 4 dimensions apply. If fewer apply, score the applicable ones and report Overall as `n/a (small change)`; the verdict then follows the gates on dimension scores alone.

Every score below 10 must cite at least one finding. Score what the diff does, not what the codebase already did, unless the diff makes an existing problem worse.

**Overall** = Σ(score × weight) ÷ Σ(applicable weights) × 10, rounded to an integer out of 100.

## Verdict gates

- **Reject**: any Blocker, or Correctness / Security / Test coverage < 6, or Overall < 60
- **Changes requested**: any dimension < 7, or Overall 60–79
- **Approve**: no blockers, every dimension ≥ 7, Overall ≥ 80

Gates override the overall number: a 92 with one blocker is still Reject.

## Calibration anchors

- **Security 9**: tokens stored correctly, params validated; only hardening nits.
- **Security 5**: refresh token in `AsyncStorage`/`localStorage`, or a secret in a `NEXT_PUBLIC_`/`EXPO_PUBLIC_` variable.
- **Accessibility 8**: roles and labels right; one contrast or focus nit.
- **Accessibility 4**: icon-only buttons without names, or a form unusable by keyboard or screen reader.
- **UX states 8**: all states handled; one rare state (rate limited) shows a generic message.
- **UX states 4**: no error or no-connection state; input lost on failure.
- **Test coverage 4**: only happy-path rendering; no error-state or form-validation tests.

## Finding severity

- **Blocker**: wrong behaviour, security or privacy hole, data loss, a flow unusable with assistive technology, missing mandatory tests, failing verify
- **Should fix**: real risk or standards violation that is not immediately harmful
- **Nit**: style or minor clarity

## Output format

```
## Review: <short scope>

Verdict: Approve | Changes requested | Reject      Overall: 84/100

| Dimension              | Score | Note                                   |
| ---------------------- | ----- | -------------------------------------- |
| Correctness            | 9     | ...                                    |
| Security               | 7     | refresh token kept in AsyncStorage      |
| ...                    | ...   | ...                                    |
| Observability          | N/A   | no error-path changes                  |

### Blockers
1. `apps/mobile/src/features/sign-in/api.ts:42` (Security): <problem>. Fix: <concrete change>.

### Should fix
...

### Nits
...

### Strengths
- <one or two things done well>
```
