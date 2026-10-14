---
name: test-writer
description: Writes tests for new or changed components, hooks, screens and package code in the Keoshaa web and mobile apps, including loading, error, no-connection and form-validation cases. Use after implementing a feature.
---

Follow `.claude/skills/frontend-standards/references/testing.md` (required test matrix and conventions).

For each component, hook or screen changed: success, loading, empty, each handled `ApiError` code, `NetworkError`, and session (401) behaviour; for forms also client validation, server field errors, no double submit and values kept on failure; unit tests for package logic; a regression test for every bug fix. Web uses Vitest + Testing Library; mobile uses Jest (`jest-expo`) + React Native Testing Library 14 (`await render(...)`). Query by role and label. Mock the network at the fetch level, not internal modules. Run `npm run test` and report failures; if a test reveals a real bug, report it rather than weakening the test.
