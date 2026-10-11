import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Where a production engine answers differently from a development one: its
 * request list, which needs a token a browser does not hold; the request itself,
 * which refuses a name that is too long and may ask for a key; and the progress
 * stream, which is asked for one request.
 *
 * The engine address and key are read when the module loads, so each test loads
 * it afresh with them set.
 */
const load = async (key = "") => {
  vi.resetModules();
  vi.stubEnv("HGA_ENGINE_URL", "http://engine.test");
  vi.stubEnv("HGA_ENGINE_API_KEY", key);
  return import("./engine");
};

describe("against an engine with an address", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 500 }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("lists no recent requests, without an error, when the engine answers 401", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 401 }));
    const { engineRecentRequests } = await load();
    await expect(engineRecentRequests()).resolves.toEqual([]);
  });

  it("still fails the request list on any other status", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 500 }));
    const { engineRecentRequests } = await load();
    await expect(engineRecentRequests()).rejects.toThrow("500");
  });

  it("refuses a name past the engine's limit with a sentence and without a request", async () => {
    const { engineSuggestStream } = await load();
    await expect(engineSuggestStream({ name: "x".repeat(201) }, vi.fn(), vi.fn())).rejects.toThrow(
      "at most 200"
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends no key header where the build has no key", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 500 }));
    const { engineSuggestStream } = await load();
    await engineSuggestStream({ name: "Breslau" }, vi.fn(), vi.fn()).catch(() => undefined);
    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("sends the key as a bearer token, and names a refused key as a configuration problem", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 401 }));
    const { engineSuggestStream } = await load("a-test-key");
    await expect(engineSuggestStream({ name: "Breslau" }, vi.fn(), vi.fn())).rejects.toThrow(
      "HGA_ENGINE_API_KEY"
    );
    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer a-test-key");
  });

  it("follows progress with the request's own id on the stream address", async () => {
    const opened: string[] = [];
    vi.stubGlobal(
      "EventSource",
      class {
        constructor(url: string) {
          opened.push(url);
        }
        close() {}
      }
    );
    const { watchEngineProgress } = await load();
    watchEngineProgress("req 1", vi.fn())();
    expect(opened).toEqual(["http://engine.test/state/stream?requestId=req%201"]);
    vi.unstubAllGlobals();
  });
});
