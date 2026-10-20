import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * What reaches the engine through the InkVisitor API: the request itself, which
 * refuses a name that is too long and carries the session rather than a key,
 * the health states the proxy reports, and the progress stream, which is asked
 * for one request. Each request also leaves a line in this browser's own log.
 */
const load = async () => {
  vi.resetModules();
  return import("./engine");
};

describe("against the engine through the API", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 500 }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refuses a name past the engine's limit with a sentence and without a request", async () => {
    const { engineSuggestStream } = await load();
    await expect(engineSuggestStream({ name: "x".repeat(201) }, vi.fn(), vi.fn())).rejects.toThrow(
      "at most 200"
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("logs a request that failed, and not one the researcher abandoned", async () => {
    window.localStorage.clear();
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 500 }));
    const { engineSuggestStream } = await load();
    await engineSuggestStream({ name: "Breslau" }, vi.fn(), vi.fn()).catch(() => undefined);
    vi.mocked(fetch).mockRejectedValue(new DOMException("stopped", "AbortError"));
    await engineSuggestStream({ name: "Zobten" }, vi.fn(), vi.fn()).catch(() => undefined);
    const { readRequestLog } = await import("./requestLog");
    expect(readRequestLog().map((entry) => [entry.name, entry.status])).toEqual([
      ["Breslau", "failed"],
    ]);
  });

  it("sends the session and the client header, and no engine key", async () => {
    const { engineSuggestStream, ENGINE_URL } = await load();
    await engineSuggestStream({ name: "Breslau" }, vi.fn(), vi.fn()).catch(() => undefined);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(`${ENGINE_URL}/suggest/stream`);
    expect(init?.credentials).toBe("include");
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-InkVisitor-Client"]).toBe("1");
    expect(headers.Authorization).toBeUndefined();
  });

  it("sends no clientId; the server sets it", async () => {
    const { engineSuggestStream } = await load();
    await engineSuggestStream({ name: "Breslau" }, vi.fn(), vi.fn()).catch(() => undefined);
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body).not.toHaveProperty("clientId");
  });

  it("reports the proxy's message when the engine is refused or down", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        '{"result":false,"error":"GeocodingEngineError","message":"check HGA_ENGINE_API_KEY on the server"}',
        { status: 502 }
      )
    );
    const { engineSuggestStream } = await load();
    await expect(engineSuggestStream({ name: "Breslau" }, vi.fn(), vi.fn())).rejects.toThrow(
      "HGA_ENGINE_API_KEY"
    );
  });

  it("reads the three health states from the proxy", async () => {
    const { engineHealth } = await load();
    vi.mocked(fetch).mockResolvedValue(new Response('{"configured":false}', { status: 200 }));
    await expect(engineHealth()).resolves.toEqual({ configured: false });
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(engineHealth()).resolves.toEqual({ configured: true, ok: false });
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 401 }));
    await expect(engineHealth()).resolves.toEqual({ configured: true, ok: false });
  });

  it("follows progress with the request's own id on the stream address, with credentials", async () => {
    const opened: [string, EventSourceInit | undefined][] = [];
    vi.stubGlobal(
      "EventSource",
      class {
        constructor(url: string, init?: EventSourceInit) {
          opened.push([url, init]);
        }
        close() {}
      }
    );
    const { watchEngineProgress, ENGINE_URL } = await load();
    watchEngineProgress("req 1", vi.fn())();
    expect(opened).toEqual([
      [`${ENGINE_URL}/state/stream?requestId=req%201`, { withCredentials: true }],
    ]);
    vi.unstubAllGlobals();
  });
});
