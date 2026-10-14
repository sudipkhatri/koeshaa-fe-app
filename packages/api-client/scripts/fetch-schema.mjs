// Downloads the backend's OpenAPI schema into openapi.json (then run `npm run api:generate`).
// Source: API_SCHEMA_URL, default http://localhost:8000/openapi.json.
import { writeFile } from "node:fs/promises";

const url = process.env.API_SCHEMA_URL ?? "http://localhost:8000/openapi.json";
const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
if (!response.ok) {
  console.error(`Could not fetch ${url}: HTTP ${response.status}`);
  process.exit(1);
}
const schema = await response.json();
await writeFile(
  new URL("../openapi.json", import.meta.url),
  JSON.stringify(schema, null, 2) + "\n",
);
console.log(`Saved ${Object.keys(schema.paths ?? {}).length} paths from ${url}`);
