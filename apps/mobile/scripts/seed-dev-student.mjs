// Creates the dev test student on a local backend and puts them in Class 10 (the seeded class
// that has a published subject pool). Needs the API started with AUTH_DEV_LOG_CODES=true and its
// log in a file: `API_LOG=/path/to/api.log node scripts/seed-dev-student.mjs`.
import { readFile } from "node:fs/promises";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const LOG = process.env.API_LOG;

// This script creates a test account with a known password: local backends only.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "10.0.2.2"]);
let apiHost = "";
try {
  apiHost = new URL(API).hostname;
} catch {
  // falls through to the refusal below
}
if (!LOCAL_HOSTS.has(apiHost) && !apiHost.endsWith(".localhost")) {
  console.error(`Refusing to seed "${API}": only a local backend (localhost) is allowed.`);
  process.exit(1);
}

const PHONE = process.env.SEED_PHONE ?? "9800000001";
const PASSWORD = "keoshaa-dev-123";
const DEVICE = "seed-script-device-0001";
const TERMS_VERSION = process.env.TERMS_VERSION ?? "2026-10";

if (!LOG) {
  console.error("Set API_LOG to the file the API writes its log to.");
  process.exit(1);
}

async function call(path, body, token, method = body === undefined ? "GET" : "POST") {
  const response = await fetch(`${API}/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${json?.error?.code}`);
  return json?.data;
}

const signInBody = JSON.stringify({ identifier: PHONE, password: PASSWORD, device_id: DEVICE });
const signIn = await fetch(`${API}/api/v1/auth/sign-in`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: signInBody,
});

let token;
if (signIn.ok) {
  token = (await signIn.json()).data.tokens.access_token;
} else {
  await call("/auth/codes", { purpose: "signup", identifier: PHONE });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const log = await readFile(LOG, "utf8");
  const code = [...log.matchAll(/purpose=\S*signup\S* code=(\d{6})/g)].at(-1)?.[1];
  if (!code)
    throw new Error("No sign-up code in the API log. Start the API with AUTH_DEV_LOG_CODES=true.");
  const registered = await call("/auth/register/student", {
    name: "Aarav",
    date_of_birth: "2012-05-10",
    identifier: PHONE,
    code,
    password: PASSWORD,
    consents: { terms_version: TERMS_VERSION, privacy_version: TERMS_VERSION },
    device_id: DEVICE,
  });
  token = registered.tokens?.access_token ?? registered.access_token;
}

const enrollments = await call("/me/enrollments", undefined, token);
if (enrollments.current.length > 0 && enrollments.current[0].state !== "draft") {
  console.log("Dev student is already in a class; nothing to do.");
  process.exit(0);
}
const year = await (await fetch(`${API}/api/v1/catalog/academic-years/current`)).json();
const grades = await (await fetch(`${API}/api/v1/catalog/grade-levels`)).json();
const grade = grades.data.find((g) => g.code === "c10");
const enrollment =
  enrollments.current[0] ??
  (await call(
    "/me/enrollments",
    { academic_year_id: year.data.id, grade_level_id: grade.id },
    token,
  ));
await call(
  `/me/enrollments/${enrollment.id}`,
  { optionals_deferred: true, draft_step: 5 },
  token,
  "PATCH",
);
await call(`/me/enrollments/${enrollment.id}/confirm`, {}, token);
console.log(`Dev student (phone ${PHONE}) is in Class 10.`);
