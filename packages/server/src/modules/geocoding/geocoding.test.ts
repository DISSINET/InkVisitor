import http from "http";
import { AddressInfo } from "net";
import express from "express";
import errorsMiddleware from "@middlewares/errors";
import GeocodingRouter from "./index";

interface IStubRequest {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: any;
}

interface IStubReply {
  status?: number;
  headers?: Record<string, string>;
  body?: string;
  // keeps the connection open without ever answering
  hang?: boolean;
  // answers as an event stream: "end" sends both frames 150 ms apart and ends,
  // "open" sends the first frame and keeps the response open, "silent" keeps
  // the response open without sending headers
  stream?: "end" | "open" | "silent";
}

const FRAME_ACCEPTED = 'event: accepted\ndata: {"requestId":"r1"}\n\n';
const FRAME_FINAL = "event: final\ndata: {}\n\n";

let stub: http.Server;
let proxy: http.Server;
let stubUrl: string;
let proxyUrl: string;
let seen: IStubRequest[] = [];
let respond: Record<string, IStubReply> = {};
let hanging: http.ServerResponse[] = [];
let secondFrameAt = 0;
// resolves when a stream response's connection closes before the stub ended it
let upstreamClosed: Promise<void>;
let markUpstreamClosed: () => void;

const urlOf = (server: http.Server) =>
  `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

const listen = (server: http.Server) =>
  new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

const close = (server: http.Server) =>
  new Promise<void>((resolve) => server.close(() => resolve()));

// whether the stub saw its stream response closed early within ms
const closedWithin = async (ms: number) => {
  let timer: NodeJS.Timeout | undefined;
  const closed = await Promise.race([
    upstreamClosed.then(() => true),
    new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), ms);
    }),
  ]);
  clearTimeout(timer);
  return closed;
};

const post = (path: string, body?: string) =>
  fetch(proxyUrl + path, {
    method: "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body,
  });

beforeAll(async () => {
  stub = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      seen.push({
        method: req.method || "",
        url: req.url || "",
        headers: req.headers,
        body: raw ? JSON.parse(raw) : undefined,
      });
      const reply = respond[(req.url || "").split("?")[0]] || {};
      if (reply.hang) {
        hanging.push(res);
        return;
      }
      if (reply.stream) {
        // req emits close as soon as its body is read, the response's close
        // is the one that tracks the connection
        res.on("close", () => !res.writableEnded && markUpstreamClosed());
        if (reply.stream === "silent") {
          hanging.push(res);
          return;
        }
        res.writeHead(reply.status || 200, {
          "Content-Type": "text/event-stream",
        });
        res.write(FRAME_ACCEPTED);
        if (reply.stream === "open") {
          hanging.push(res);
          return;
        }
        setTimeout(() => {
          secondFrameAt = Date.now();
          res.end(FRAME_FINAL);
        }, 150);
        return;
      }
      res.writeHead(reply.status || 200, {
        "Content-Type": "application/json",
        ...reply.headers,
      });
      res.end(reply.body ?? "{}");
    });
  });
  proxy = http.createServer(
    express()
      .use(express.json())
      .use("/geocoding", GeocodingRouter)
      .use(errorsMiddleware)
  );
  await Promise.all([listen(stub), listen(proxy)]);
  stubUrl = urlOf(stub);
  proxyUrl = urlOf(proxy);
});

afterAll(async () => {
  await Promise.all([close(stub), close(proxy)]);
});

beforeEach(() => {
  process.env.HGA_ENGINE_URL = stubUrl;
  process.env.HGA_ENGINE_API_KEY = "";
  process.env.ENV = "test-instance";
  seen = [];
  respond = {};
  secondFrameAt = 0;
  upstreamClosed = new Promise((resolve) => (markUpstreamClosed = resolve));
});

afterEach(() => {
  hanging.forEach((res) => res.destroy());
  hanging = [];
});

describe("geocoding proxy", () => {
  it("answers configured: false without an engine address", async () => {
    process.env.HGA_ENGINE_URL = "";
    const r = await fetch(proxyUrl + "/geocoding/health");
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ configured: false });
  });

  it("answers ok: true when the engine's /health is 2xx, ok: false when it is not", async () => {
    respond["/health"] = { status: 200 };
    let r = await fetch(proxyUrl + "/geocoding/health");
    expect(await r.json()).toEqual({ configured: true, ok: true });

    respond["/health"] = { status: 500 };
    r = await fetch(proxyUrl + "/geocoding/health");
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ configured: true, ok: false });
  });

  it("answers ok: false when the engine accepts the connection and never replies", async () => {
    respond["/health"] = { hang: true };
    const started = Date.now();
    const r = await fetch(proxyUrl + "/geocoding/health");
    expect(await r.json()).toEqual({ configured: true, ok: false });
    expect(Date.now() - started).toBeLessThan(10000);
  }, 15000);

  it("relays a JSON route's status and body as-is", async () => {
    respond["/suggesters"] = { status: 200, body: '[{"id":"geonames"}]' };
    let r = await fetch(proxyUrl + "/geocoding/suggesters");
    expect(r.status).toBe(200);
    expect(await r.text()).toBe('[{"id":"geonames"}]');

    respond["/suggesters"] = {
      status: 422,
      headers: { "Content-Type": "text/html" },
      body: "<h1>nope</h1>",
    };
    r = await fetch(proxyUrl + "/geocoding/suggesters");
    expect(r.status).toBe(422);
    expect(await r.text()).toBe("<h1>nope</h1>");
  });

  it("passes the query string through on GET", async () => {
    await fetch(proxyUrl + "/geocoding/search?q=Breslau&limit=5");
    expect(seen[0].url).toBe("/search?q=Breslau&limit=5");
  });

  it("sends only its own headers upstream, with the bearer when a key is set", async () => {
    const browserHeaders = {
      Cookie: "inkvisitor.sid=x",
      "X-InkVisitor-Client": "1",
    };
    await fetch(proxyUrl + "/geocoding/parameters", { headers: browserHeaders });
    expect(seen[0].headers.cookie).toBeUndefined();
    expect(seen[0].headers["x-inkvisitor-client"]).toBeUndefined();
    expect(seen[0].headers.authorization).toBeUndefined();

    process.env.HGA_ENGINE_API_KEY = "k1";
    await fetch(proxyUrl + "/geocoding/parameters", { headers: browserHeaders });
    expect(seen[1].headers.cookie).toBeUndefined();
    expect(seen[1].headers["x-inkvisitor-client"]).toBeUndefined();
    expect(seen[1].headers.authorization).toBe("Bearer k1");
  });

  it("overwrites clientId in a POST body with the server's own", async () => {
    await post(
      "/geocoding/feedback",
      JSON.stringify({ chosen: null, clientId: "spoof" })
    );
    expect(seen[0].method).toBe("POST");
    expect(seen[0].body).toEqual({
      chosen: null,
      clientId: "inkvisitor-test-instance",
    });
  });

  it("survives a POST body that is not an object", async () => {
    await post("/geocoding/feedback", "[1]");
    await post("/geocoding/feedback");
    expect(seen.map((s) => s.body)).toEqual([
      { clientId: "inkvisitor-test-instance" },
      { clientId: "inkvisitor-test-instance" },
    ]);
  });

  it("answers 503 GeocodingEngineUnconfiguredError without an engine address", async () => {
    process.env.HGA_ENGINE_URL = "";
    const r = await fetch(proxyUrl + "/geocoding/suggesters");
    expect(r.status).toBe(503);
    expect((await r.json()).error).toBe("GeocodingEngineUnconfiguredError");
  });

  it("answers 502 GeocodingEngineError when the engine does not answer", async () => {
    process.env.HGA_ENGINE_URL = "http://127.0.0.1:1";
    const r = await fetch(proxyUrl + "/geocoding/suggesters");
    expect(r.status).toBe(502);
    expect((await r.json()).error).toBe("GeocodingEngineError");
  });

  it("names HGA_ENGINE_API_KEY when the engine refuses the key", async () => {
    respond["/suggesters"] = { status: 401 };
    const r = await fetch(proxyUrl + "/geocoding/suggesters");
    expect(r.status).toBe(502);
    expect((await r.json()).message).toContain("HGA_ENGINE_API_KEY");
  });

  it("relays stream frames as they arrive, with the stream headers", async () => {
    respond["/suggest/stream"] = { stream: "end" };
    const r = await post(
      "/geocoding/suggest/stream",
      JSON.stringify({ name: "Breslau" })
    );
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toMatch(/^text\/event-stream/);
    expect(r.headers.get("cache-control")).toBe("no-cache");
    expect(r.headers.get("x-accel-buffering")).toBe("no");

    const reader = r.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let firstChunkAt = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      firstChunkAt = firstChunkAt || Date.now();
      text += decoder.decode(value, { stream: true });
    }
    expect(secondFrameAt).toBeGreaterThan(0);
    expect(firstChunkAt).toBeLessThan(secondFrameAt);
    expect(text).toBe(FRAME_ACCEPTED + FRAME_FINAL);
  });

  it("relays a non-2xx stream status with the engine's body and does not stream", async () => {
    respond["/suggest/stream"] = { status: 422, body: '{"error":"too long"}' };
    const r = await post("/geocoding/suggest/stream", "{}");
    expect(r.status).toBe(422);
    expect(await r.text()).toBe('{"error":"too long"}');
  });

  it("aborts the upstream request when the browser disconnects", async () => {
    respond["/state/stream"] = { stream: "open" };
    const browser = new AbortController();
    const r = await fetch(proxyUrl + "/geocoding/state/stream?requestId=r1", {
      signal: browser.signal,
    });
    expect(r.status).toBe(200);
    await r.body!.getReader().read();
    browser.abort();

    expect(await closedWithin(1000)).toBe(true);
    expect(seen[0].url).toBe("/state/stream?requestId=r1");
  });

  it("aborts the upstream request when the browser disconnects before the engine answers", async () => {
    respond["/state/stream"] = { stream: "silent" };
    const browser = new AbortController();
    const pending = fetch(
      proxyUrl + "/geocoding/state/stream?requestId=r2",
      { signal: browser.signal }
    ).catch((err) => err);
    setTimeout(() => browser.abort(), 50);
    expect((await pending).name).toBe("AbortError");

    expect(await closedWithin(1000)).toBe(true);
    expect(seen[0].url).toBe("/state/stream?requestId=r2");
  });
});
