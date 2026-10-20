/**
 * Server-side proxy to the HGA geocoding engine. The engine address and API
 * key live in the server env (HGA_ENGINE_URL, HGA_ENGINE_API_KEY), so the
 * browser never sees either. Only the routes registered below are forwarded:
 * the proxy is an explicit allowlist, never a wildcard pass-through.
 */
import {
  NextFunction,
  Request,
  RequestHandler,
  Response as ExpressResponse,
  Router,
} from "express";
import { Readable, pipeline } from "node:stream";
import { promisify } from "node:util";
import {
  GeocodingEngineError,
  GeocodingEngineUnconfiguredError,
} from "@inkvisitor/shared/types/errors";
import { IGeocodingHealth } from "@inkvisitor/shared/types/geocoding";

// node:stream/promises is missing from the pinned @types/node
const pipe = promisify(pipeline);

export const engineUrl = (): string =>
  (process.env.HGA_ENGINE_URL || "").replace(/\/+$/, "");

export const engineClientId = (): string =>
  `inkvisitor-${process.env.ENV || "dev"}`;

// the only headers sent upstream: nothing from the browser request is forwarded
const engineHeaders = (): Record<string, string> => {
  const key = process.env.HGA_ENGINE_API_KEY;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(key ? { Authorization: `Bearer ${key}` } : {}),
  };
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Sends the request to the engine. GET carries the incoming query string;
 * POST carries the incoming JSON object with clientId set by the server.
 */
export const engineRequest = async (
  req: Request,
  path: string,
  signal?: AbortSignal
): Promise<Response> => {
  const base = engineUrl();
  if (!base) {
    throw new GeocodingEngineUnconfiguredError();
  }

  const isPost = req.method === "POST";
  const q = req.url.indexOf("?");
  const url = base + path + (!isPost && q >= 0 ? req.url.slice(q) : "");

  let r: Response;
  try {
    r = await fetch(url, {
      method: isPost ? "POST" : "GET",
      headers: engineHeaders(),
      body: isPost
        ? JSON.stringify({
            ...(isPlainObject(req.body) ? req.body : {}),
            clientId: engineClientId(),
          })
        : undefined,
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw err;
    }
    throw new GeocodingEngineError();
  }

  if (r.status === 401 || r.status === 403) {
    throw new GeocodingEngineError(
      "The geocoding engine refused this server's key: check HGA_ENGINE_API_KEY on the server."
    );
  }
  return r;
};

/** Wraps a handler with the ACL check and hands any error to the errors middleware. */
export const engineRoute =
  (fn: (req: Request, res: ExpressResponse) => Promise<void>): RequestHandler =>
  async (req: Request, res: ExpressResponse, next: NextFunction) => {
    if (req.acl) {
      const err = await req.acl.validate(req);
      if (err) {
        next(err);
        return;
      }
    }
    try {
      await fn(req, res);
    } catch (err) {
      next(err);
    }
  };

/** Relays the engine's status and body unchanged. */
export const relayJson = (path: string) =>
  engineRoute(async (req, res) => {
    const r = await engineRequest(req, path);
    res.status(r.status).type("json").send(await r.text());
  });

/**
 * Relays the engine's event stream frame by frame. Closing the browser
 * connection aborts the upstream fetch, so an abandoned watch never holds an
 * engine connection open.
 */
export const relayStream = (path: string) =>
  engineRoute(async (req, res) => {
    const controller = new AbortController();
    res.on("close", () => controller.abort());
    try {
      const r = await engineRequest(req, path, controller.signal);
      if (!r.ok || !r.body) {
        res.status(r.status).send(await r.text());
        return;
      }
      res.status(r.status);
      res.setHeader(
        "Content-Type",
        r.headers.get("Content-Type") || "text/event-stream"
      );
      res.setHeader("Cache-Control", "no-cache");
      // stops an nginx in front of the server from buffering the frames
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      // Readable.fromWeb is missing from the pinned @types/node
      await pipe((Readable as any).fromWeb(r.body), res);
    } catch (err) {
      // a disconnected browser has nothing left to receive
      if (!controller.signal.aborted) {
        throw err;
      }
    }
  });

// always 200: the answer itself says whether the engine is configured and up
const health = engineRoute(async (_req, res) => {
  if (!engineUrl()) {
    res.json({ configured: false } as IGeocodingHealth);
    return;
  }
  let ok = false;
  try {
    const r = await fetch(engineUrl() + "/health", {
      headers: engineHeaders(),
      signal: AbortSignal.timeout(3000),
    });
    ok = r.ok;
  } catch {
    ok = false;
  }
  res.json({ configured: true, ok } as IGeocodingHealth);
});

export default Router()
  .get("/health", health)
  .get("/parameters", relayJson("/parameters"))
  .get("/suggesters", relayJson("/suggesters"))
  .get("/search", relayJson("/search"))
  .post("/feedback", relayJson("/feedback"))
  .post("/suggest/stream", relayStream("/suggest/stream"))
  .get("/state/stream", relayStream("/state/stream"));
