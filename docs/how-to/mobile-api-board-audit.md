# Mobile API ↔ board audit

Run a **node-by-node** pass against `project/M-*.dc.html` and `packages/api-client` when a batch of mobile screens lands. Update this table; do not invent endpoints.

| Board                                    | App surface                    | API                              | Status                                                       |
| ---------------------------------------- | ------------------------------ | -------------------------------- | ------------------------------------------------------------ |
| M-Foundations                            | tokens / kit                   | —                                | Design only                                                  |
| M-Welcome / Sign-In / Verify / Register  | onboarding                     | `/auth/*`                        | Wired                                                        |
| M-Enrol-Class                            | pick-class / stream            | `/me/enrollments`, catalog       | Wired (starts draft)                                         |
| M-Enrol-Optionals / Confirm              | pick-optionals / enrol-confirm | pool, optionals, confirm         | Wired (parent phone via `parent_contact`)                    |
| M-Enrolled                               | Home                           | enrollments, catalog             | Partial (streak/goal mock)                                   |
| M-Parent-Home / Add-Child / Child-Detail | `features/parent`              | `/me/children*`                  | Wired (grade only on list)                                   |
| M-Guardian-Invite                        | Me → linked parent (student)   | POST invite, resend              | Wired student→parent; **parent→child invite not in OpenAPI** |
| M-Guardian-Accept                        | `/guardian/accept`             | GET invites, accept, DELETE link | Wired for **parent** accept (board shows student accept)     |
| M-Reset-Password                         | onboarding                     | `/auth/password/reset`           | Wired                                                        |
| M-Account / Security / Settings          | Me                             | `/me/*`                          | Partial                                                      |
| M-Enrolment                              | Me → Your class                | window + corrections / requests  | Wired; request history **ApiNote** (no student list)         |
| M-Alerts                                 | Alerts tab                     | `/notifications*`                | Wired                                                        |
| M-Search                                 | Search tab                     | `/me/search?q&course_id`         | Stub — blocked: enrollment has no `course_id`                |
| M-Drive                                  | —                              | `/drive*`                        | **Gap**                                                      |
| M-Prompt                                 | Home banner                    | `/me/prompts`                    | Partial (`second_device` only)                               |

**Remaining batches (suggested order):** Account identifiers / Security backup codes → Drive → Prompts. Search waits on a student `course_id` (or catalog course lookup) in OpenAPI.

After the last batch: walk every row above, open the board HTML, compare fields to the OpenAPI operation, and mark Wired / ApiNote / Gap only from evidence.
