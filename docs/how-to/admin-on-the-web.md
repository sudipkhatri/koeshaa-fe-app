# Admin on the web

Staff open `/admin` in the web app. The page restores the session from the backend's HttpOnly refresh cookie. If that cookie is missing, the same page asks for a sign-in.

The area calls every admin endpoint the API currently publishes:

| Screen          | Endpoint                                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| School leads    | `GET /api/v1/admin/school-leads`, `GET` and `PATCH /api/v1/admin/school-leads/{lead_id}` (list shows `assigned_name`; PATCH still sends `assigned_to`)                          |
| Change requests | `GET /api/v1/enrollment/change-requests`, `POST /api/v1/enrollment/change-requests/{request_id}/decision`                                                                       |
| Duplicates      | `GET /api/v1/users/duplicates`, `POST /api/v1/users/duplicates/{duplicate_id}/decision`                                                                                         |
| Schools         | `GET` and `POST /api/v1/organisations`, `GET` and `PATCH /api/v1/organisations/{organisation_id}`, `POST .../status`, `POST` and `DELETE .../members`, `GET /api/v1/me/schools` |
| Settings        | `GET /api/v1/admin/settings`, `PUT /api/v1/admin/settings/{key}`, `GET /api/v1/admin/settings/{key}/history`                                                                    |
| Webhooks        | `GET` and `POST /api/v1/notifications/admin/webhooks`, `PATCH` and `DELETE .../{endpoint_id}`                                                                                   |
| Deliveries      | `GET /api/v1/notifications/admin/deliveries`                                                                                                                                    |
| Site pages      | `POST /api/v1/admin/site-pages`                                                                                                                                                 |

The backend must list the web origin in `AUTH_ALLOWED_ORIGINS` so the refresh cookie is sent. See [Configuration](../reference/configuration.md).

A webhook signing secret and an authenticator setup key are shown once on the page and are not stored by the app.

Anyone can ask the team to call a school at `/schools` (`POST /api/v1/public/school-leads`). That form does not create the school. Staff create it under Schools, then can paste its id onto a won lead.
