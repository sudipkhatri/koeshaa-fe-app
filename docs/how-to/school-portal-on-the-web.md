# School portal on the web

School staff open `/school` in the web app. The page restores the session from the backend's HttpOnly refresh cookie. If that cookie is missing, the same page asks for a sign-in.

Forgot password on that sign-in screen is self-serve: the person asks for a code (`POST /api/v1/auth/codes` with `purpose: "reset"`), enters it, then sets a new password (`POST /api/v1/auth/password/reset`). There is no admin action to set another person's password.

`GET /api/v1/me/schools` decides which schools the person can open. One school redirects straight into it; several show a picker.

| Screen         | Path                                | Endpoint                                                                                           |
| -------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| Overview       | `/school/{organisationId}`          | Membership check only; seats, counts and progress are marked "API to be added"                     |
| People         | `/school/{organisationId}/people`   | `GET`/`POST`/`DELETE` `/api/v1/organisations/{id}/members`, account lookup via `GET /api/v1/users` |
| School details | `/school/{organisationId}/details`  | `GET`/`PATCH` `/api/v1/organisations/{id}`, school switcher from `GET /api/v1/me/schools`          |
| Students       | `/school/{organisationId}/students` | Stub until a students API exists                                                                   |
| Add students   | `/school/{organisationId}/import`   | Stub until an import API exists                                                                    |
| Progress       | `/school/{organisationId}/progress` | Stub until a progress API exists                                                                   |

Landing **School sign in** points here. Platform staff still use `/admin`.
