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
}

let stub: http.Server;
let proxy: http.Server;
let stubUrl: string;
let proxyUrl: string;
let seen: IStubRequest[] = [];
let respond: Record<string, IStubReply> = {};
let hanging: http.ServerResponse[] = [];

const urlOf = (server: http.Server) =>
  `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

const listen = (server: http.Server) =>
  new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

const close = (server: http.Server) =>
  new Promise<void>((resolve) => server.close(() => resolve()));

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
});
