import { setupServer } from "msw/node";

/** Mock network for API tests (testing.md): handlers are added per test. */
export const server = setupServer();

export const API = "http://api.test";
