import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureSuggestResponse, isFixtureMode } from "./fixtureMode";

/**
 * The guard that matters is the environment one: fixture data reaching a
 * researcher would look exactly like a real answer and be wrong about a real
 * place. Everything else here is convenience.
 */

const setEnv = (env: string) => {
  vi.stubEnv("ENV", env);
};

const setUrl = (search: string) => {
  window.history.replaceState({}, "", `/geocoding${search}`);
};

describe("isFixtureMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setUrl("");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is off outside development, whatever the url says", () => {
    setEnv("production");
    setUrl("?fixture=1");
    expect(isFixtureMode()).toBe(false);
  });

  it("is off outside development even once it was turned on in development", () => {
    setEnv("development");
    setUrl("?fixture=1");
    expect(isFixtureMode()).toBe(true);
    setEnv("production");
    setUrl("");
    expect(isFixtureMode()).toBe(false);
  });

  it("is off by default in development", () => {
    setEnv("development");
    expect(isFixtureMode()).toBe(false);
  });

  it("turns on from the url and stays on afterwards", () => {
    setEnv("development");
    setUrl("?fixture=1");
    expect(isFixtureMode()).toBe(true);
    setUrl("");
    expect(isFixtureMode()).toBe(true);
  });

  it("turns off again from the url, so a link can undo it", () => {
    setEnv("development");
    setUrl("?fixture=1");
    isFixtureMode();
    setUrl("?fixture=0");
    expect(isFixtureMode()).toBe(false);
    setUrl("");
    expect(isFixtureMode()).toBe(false);
  });
});

describe("fixtureSuggestResponse", () => {
  it("carries the awkward cases a hand-written stub would smooth over", () => {
    const response = fixtureSuggestResponse();
    expect(response.suggestions.length).toBeGreaterThan(1);
    // most results off-region is normal when a region is set, and the UI has to
    // look right in that state rather than in an idealised one
    expect(response.suggestions.filter((s) => s.offRegion).length).toBeGreaterThan(1);
    // a source reporting `ran` with nothing found is evidence; one reporting
    // `skipped` is not, and the report must tell them apart
    expect(response.sources.some((s) => s.status === "ran" && s.count === 0)).toBe(true);
    expect(response.sources.some((s) => s.status === "skipped")).toBe(true);
  });

  it("hands out a fresh copy, so rendering it cannot mutate the fixture", () => {
    const first = fixtureSuggestResponse();
    first.suggestions[0].label = "changed";
    expect(fixtureSuggestResponse().suggestions[0].label).not.toBe("changed");
  });
});
