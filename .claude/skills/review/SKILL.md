---
name: review
description: The official Keoshaa frontend code review (scored). Run only when the developer types /review, optionally with a scope (empty = all uncommitted changes, a commit range, or a PR number).
---

# /review

Run the official Keoshaa frontend code review on: `$ARGUMENTS` (empty means all uncommitted changes, including untracked files).

## 1. Size the change

List the changed files and line counts for the scope (`git status --porcelain` + `git diff --numstat HEAD` for uncommitted; `git diff --numstat <base>..<head>` for a range; `gh pr diff <n> --name-only` for a PR). Count untracked files by their line count. Exclude `packages/api-client/src/schema.ts`, `packages/api-client/openapi.json` and `package-lock.json` from the size (they are generated), but note whether they changed.

- **Small** (≤ 15 files and ≤ 800 changed lines): one review. Delegate to a single `code-reviewer` agent, passing the scope verbatim. Skip to step 4.
- **Large** (anything bigger): split into shards (step 2).

## 2. Shard a large change

| Shard                   | Files                                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Web                     | `apps/web/` (excluding tests)                                                                                                                   |
| Mobile                  | `apps/mobile/` (excluding tests)                                                                                                                |
| Packages                | `packages/` (excluding tests and generated files)                                                                                               |
| Tests                   | `**/*.test.ts(x)`, `**/__tests__/**`, test config                                                                                               |
| Infrastructure and docs | root config (`package.json`, `turbo.json`, `tsconfig*.json`, `eslint.config.*`), `.github/`, `.husky/`, `docs/`, `*.md` at the root, `.claude/` |

Drop empty shards. If one shard is still larger than the small limit, split it further by feature folder. Keep at most 6 shards: if splitting would exceed 6, merge the smallest shards (by file count) together until there are 6.

## 3. Run shards in parallel

Start one `code-reviewer` agent per shard, **all in the same message** so they run in parallel. Give each:

- the overall scope (so it can read surrounding code and the full file list for context);
- its shard's file list, stating it must score and report findings **only for those files**;
- an instruction to skip `npm run verify` (run it once yourself, see step 4) and to mark dimensions its shard does not touch as N/A.

## 4. Merge and report

1. Run `npm run verify` once and use its result for every shard (a failure is a Blocker).
2. Merge the shard scorecards into one, following `.claude/skills/frontend-standards/references/review.md`:
   - each dimension's score is the **lowest** score any shard gave it (N/A only if every shard said N/A);
   - combine findings, remove duplicates, keep `file:line`, and order by severity;
   - compute Overall from the merged scores and apply the verdict gates to the merged result.
3. Report in the rubric's output format. Add a short **Shards** line: shard name, file count, and that shard's verdict.

Do not edit any files and do not start fixing findings. Wait for the developer to decide what to fix.
