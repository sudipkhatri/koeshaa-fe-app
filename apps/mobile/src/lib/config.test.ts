import { apiBaseUrl, isMockMode, startsAtOnboarding } from "./config";

const g = globalThis as unknown as { __DEV__: boolean };
const original = { dev: g.__DEV__, api: process.env.EXPO_PUBLIC_API_URL };

afterEach(() => {
  g.__DEV__ = original.dev;
  if (original.api === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = original.api;
  process.env.EXPO_PUBLIC_USE_MOCKS = "1";
  delete process.env.EXPO_PUBLIC_START_AT_ONBOARDING;
});

describe("mock mode gating", () => {
  it("is on in development when asked for", () => {
    g.__DEV__ = true;
    expect(isMockMode()).toBe(true);
  });

  it("is never on in a release build", () => {
    g.__DEV__ = false;
    process.env.EXPO_PUBLIC_USE_MOCKS = "1";
    process.env.EXPO_PUBLIC_START_AT_ONBOARDING = "1";
    expect(isMockMode()).toBe(false);
    expect(startsAtOnboarding()).toBe(false);
  });
});

describe("apiBaseUrl", () => {
  it("defaults to the local backend in development", () => {
    g.__DEV__ = true;
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(apiBaseUrl()).toBe("http://localhost:8000");
  });

  it("requires a configured https URL in release builds", () => {
    g.__DEV__ = false;
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(() => apiBaseUrl()).toThrow(/required/);
    process.env.EXPO_PUBLIC_API_URL = "http://api.example.com";
    expect(() => apiBaseUrl()).toThrow(/https/);
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com/";
    expect(apiBaseUrl()).toBe("https://api.example.com");
  });
});
