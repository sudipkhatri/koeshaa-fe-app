# Offline

The student app must work without a connection (spec: guest progress on the device, ACC-6; a remembered device works offline for 30 days, ACC-9.6). The web is online-only for now.

## Storage (mobile)

| Data                                       | Where                            |
| ------------------------------------------ | -------------------------------- |
| Refresh token, device id                   | `expo-secure-store`              |
| App data, progress, queued writes          | `expo-sqlite` (with migrations)  |
| Small preferences (locale, dismissed tips) | Key-value storage; never secrets |

## Rules

- The UI never blocks on the network. Show cached data with its age, and a clear "No connection" state when nothing is cached.
- Writes made offline go into a queue with an idempotency key and are sent in order when the connection returns; the backend must accept the key.
- Conflicts follow the spec for each feature (e.g. guest progress is merged once with the user's choice, ACC-6.4); never silently overwrite server data.
- Sign-out and account switching clear the signed-in user's local data (shared family phones, ACC-9.5), except guest progress the spec keeps.
- After 30 days offline, ask to connect once before continuing (ACC-9.6).
- Test offline paths: no connection, connection lost mid-request, reconnect with a queue.
