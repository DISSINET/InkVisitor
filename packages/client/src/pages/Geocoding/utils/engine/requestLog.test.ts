import { beforeEach, describe, expect, it } from "vitest";
import { readRequestLog, recordRequest } from "./requestLog";

const entry = (name: string) => ({
  id: null,
  name,
  startedAt: 1,
  durationMs: 10,
  status: "finished" as const,
});

describe("this browser's request log", () => {
  beforeEach(() => window.localStorage.clear());

  it("lists the newest request first", () => {
    recordRequest(entry("first"));
    recordRequest(entry("second"));
    expect(readRequestLog().map((one) => one.name)).toEqual(["second", "first"]);
  });

  it("keeps the latest fifty and drops the oldest", () => {
    for (let i = 0; i < 55; i++) {
      recordRequest(entry(`name-${i}`));
    }
    const log = readRequestLog();
    expect(log).toHaveLength(50);
    expect(log[0].name).toBe("name-54");
    expect(log[49].name).toBe("name-5");
  });

  it("reads as empty where what is stored is not a list", () => {
    window.localStorage.setItem("geocoding-request-log", "{not json");
    expect(readRequestLog()).toEqual([]);
    window.localStorage.setItem("geocoding-request-log", '{"a":1}');
    expect(readRequestLog()).toEqual([]);
  });
});
