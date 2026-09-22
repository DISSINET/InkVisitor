import {
  EngineAuditEntry,
  StreamCandidate,
  EngineParameters,
  EngineReverseResponse,
  EngineSearchResponse,
  EngineSuggester,
  FeedbackRequest,
  SuggestRequest,
  SuggestResponse,
} from "./engineTypes";
import {
  FIXTURE_DELAY_MS,
  FIXTURE_PROVISIONAL_GAP_MS,
  FIXTURE_REQUEST_ID,
  fixtureSuggestResponse,
  isFixtureMode,
} from "./fixtureMode";

/**
 * Client for the HGA-Engine.
 *
 * The engine is a separate service reached straight from the browser, not
 * through the InkVisitor server, so nothing here goes via `api.tsx`. It holds no
 * session and needs no credentials.
 */

export const ENGINE_URL = (process.env.HGA_ENGINE_URL || "").replace(/\/+$/, "");

/**
 * Names this application to the engine's audit log. The same value for every
 * InkVisitor browser, deliberately: the engine's response cache excludes
 * `clientId` from its key, so nothing is gained by varying it, and a per-browser
 * id would let the engine's log correlate one researcher's whole session.
 *
 * The progress line follows `requestId` instead, which identifies a request
 * rather than whoever sent it.
 */
export const getClientId = (): string => `inkvisitor-${process.env.ENV || "dev"}`;

export class EngineUnreachableError extends Error {
  constructor(cause?: unknown) {
    super(
      ENGINE_URL
        ? `The geocoding engine at ${ENGINE_URL} did not respond.`
        : "No geocoding engine address is configured for this deployment.",
    );
    this.name = "EngineUnreachableError";
    this.cause = cause;
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!ENGINE_URL) {
    throw new EngineUnreachableError();
  }
  let response: Response;
  try {
    response = await fetch(`${ENGINE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
  } catch (err) {
    // an aborted request is the caller's own doing and must not read as a
    // dead engine
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new EngineUnreachableError(err);
  }
  if (!response.ok) {
    throw new Error(`Geocoding engine returned ${response.status} for ${path}`);
  }
  return (await response.json()) as T;
};

/**
 * Liveness only. The endpoint also reports cache hit rates, rate-limiter state
 * and remaining language-model allowance, and grows further fields over time —
 * nothing here reads them, so nothing here breaks when it does.
 */
export const engineHealth = async (signal?: AbortSignal): Promise<boolean> => {
  try {
    await request<{ ok: boolean }>("/health", { signal });
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    return false;
  }
};

export const engineParameters = (signal?: AbortSignal): Promise<EngineParameters> =>
  request<EngineParameters>("/parameters", { signal });

export const engineSuggesters = (signal?: AbortSignal): Promise<EngineSuggester[]> =>
  request<EngineSuggester[]>("/suggesters", { signal });

/**
 * The one call that matters, and the only route to it. Five to ten seconds
 * against a live engine: sixteen gazetteers queried in parallel, several
 * rate-limited on purpose to respect their operators' policies, and two
 * language-model passes around them. A query the engine has answered within the
 * last six hours comes back in milliseconds.
 *
 * The engine also offers a plain `POST /suggest` returning the same body in one
 * piece. Nothing here calls it: a second path would need its own fixture branch
 * and its own cache handling, and would be exercised by nobody.
 *
 * Delivered as a preview and then an answer.
 *
 * `final` is the only frame the engine promises. `provisional` arrives first on
 * a request that does the work — once the gazetteers have answered and the
 * matches are grouped, a second or two ahead of the rating — but a query already
 * in the engine's response cache has nothing provisional about it and arrives as
 * a single `final`. So this resolves on `final` and treats `provisional` as an
 * optional preview; anything that waited for `provisional` would hang forever on
 * a cache hit. Measured against the live engine: cold, provisional at 7.6 s and
 * final 3 ms later; the same query again, final alone at 13 ms.
 *
 * The first frame is provisional in ORDER, not merely in fields. `contextFit`
 * feeds the context gate, which rescores and re-sorts, and only the top ten are
 * ever rated — so a rated suggestion can fall behind an unrated one sitting at
 * the neutral gate. Measured: positions 3, 4 and 5 all changed between the two
 * frames of one query. So `final` REPLACES the list. Never merge it field by
 * field into what is on screen; that renders an order the engine disagrees with.
 * `margin`, `contextEvaluated` and `log` are absent from the preview entirely.
 *
 * `sources[]` is written once at the end of the fan-out and never revised, so
 * the suggester report can be trusted from the first frame.
 */
export const engineSuggestStream = async (
  query: SuggestRequest,
  onProvisional: (response: SuggestResponse) => void,
  onAccepted: (requestId: string) => void,
  signal?: AbortSignal,
): Promise<SuggestResponse> => {
  if (isFixtureMode()) {
    return fixtureStream(onProvisional, onAccepted, signal);
  }
  if (!ENGINE_URL) {
    throw new EngineUnreachableError();
  }
  let response: Response;
  try {
    response = await fetch(`${ENGINE_URL}/suggest/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...query, clientId: getClientId() }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new EngineUnreachableError(err);
  }
  if (!response.ok || !response.body) {
    throw new Error(`Geocoding engine returned ${response.status} for /suggest/stream`);
  }

  return consumeSuggestStream(response.body, onProvisional, onAccepted);
};

/**
 * Reads the SSE frames off one `/suggest/stream` body and resolves with the
 * final one.
 *
 * Split out from the request so the frame handling can be exercised without a
 * network: the sequence it has to survive - a preview and an answer, an answer
 * alone, a frame arriving in pieces - is decided by the engine's cache and
 * cannot be arranged from the caller's side.
 */
const consumeSuggestStream = async (
  body: ReadableStream<Uint8Array>,
  onProvisional: (response: SuggestResponse) => void,
  onAccepted: (requestId: string) => void,
): Promise<SuggestResponse> => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final: SuggestResponse | null = null;

  const consume = (frame: string) => {
    const name = /^event: (\w+)/m.exec(frame)?.[1];
    const data = /^data: (.*)$/m.exec(frame)?.[1];
    if (!data) {
      return;
    }
    let parsed: SuggestResponse;
    try {
      parsed = JSON.parse(data) as SuggestResponse;
    } catch {
      return;
    }
    // the frame names itself twice, in the SSE event name and in `phase`, and
    // they always agree; either alone is enough to tell them apart
    const phase = parsed.phase || name;
    if (phase === "accepted") {
      // carries an id and nothing else - no suggestions, no sources
      if (parsed.requestId) {
        onAccepted(parsed.requestId);
      }
    } else if (phase === "provisional") {
      onProvisional(parsed);
    } else if (phase === "final") {
      final = parsed;
    }
    // an `error` frame, or a phase this client has never heard of, is not an
    // answer; the stream ending without a final one is what reports it
  };

  // frames are `event: <name>\ndata: <json>` separated by a blank line, and a
  // read can land mid-frame, so the tail is carried forward
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    frames.forEach(consume);
  }
  // a body that ends without its blank-line terminator still holds a whole
  // frame, and dropping it would report a stream that carried an answer as one
  // that did not
  consume(buffer);

  // a stream that stopped after the preview has delivered a list whose order
  // the engine has not settled, and passing that off as the answer is worse
  // than saying nothing
  if (!final) {
    throw new Error("The geocoding engine closed the stream without a final result.");
  }
  return final;
};

/**
 * Fast place lookup for the map's own search box. Answers in about 100 ms
 * against one external gazetteer and the engine's local indexes — a different
 * route from `/suggest` entirely, with no candidate generation and no scoring.
 *
 * Cheap enough to run while someone types, given a debounce: the external source
 * bills per request against a daily allowance rather than a per-second limit.
 */
export const engineSearch = (
  q: string,
  limit: number,
  signal?: AbortSignal,
): Promise<EngineSearchResponse> =>
  request<EngineSearchResponse>(
    `/search?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(String(limit))}`,
    { signal },
  );

/** Names the place a map click landed on. Nothing depends on it having an answer. */
export const engineReverse = (
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<EngineReverseResponse> =>
  request<EngineReverseResponse>(`/reverse?lat=${lat}&lon=${lon}`, { signal });

/**
 * Records what the researcher chose, or that nothing fitted. Append-only
 * telemetry on the engine's side; nothing it stores changes scoring at runtime.
 *
 * Failure here is never surfaced as a task failure — the coordinate is already
 * written and the researcher has moved on.
 */
export const engineFeedback = async (body: FeedbackRequest): Promise<void> => {
  try {
    await request<{ id: string; recorded: boolean }>("/feedback", {
      method: "POST",
      body: JSON.stringify({ ...body, clientId: getClientId() }),
    });
  } catch {
    /* telemetry is not worth interrupting the researcher for */
  }
};

/**
 * Recent geocoding requests, from the engine's audit log.
 *
 * `clientId` names the application rather than the browser, so this is every
 * InkVisitor request the engine has served, not only this tab's. That is the
 * intended reading: the log answers "what has been asked of the engine lately",
 * and the running request is followed by id instead.
 *
 * Filtering happens on the engine, which holds every client's entries. It is
 * not a privacy boundary.
 */
export const engineRecentRequests = (signal?: AbortSignal): Promise<EngineAuditEntry[]> =>
  request<{ audit: EngineAuditEntry[] } | EngineAuditEntry[]>(
    `/state?clientId=${encodeURIComponent(getClientId())}`,
    { signal },
  ).then((body) => (Array.isArray(body) ? body : body.audit || []));

/**
 * The recorded response, delivered in the frames a cold request uses, so the
 * preview banner and the replacement of the list are both visible without an
 * engine. A cached request's single-frame shape is not reproduced here; it is
 * reached by asking the live engine the same question twice.
 */
const fixtureStream = async (
  onProvisional: (response: SuggestResponse) => void,
  onAccepted: (requestId: string) => void,
  signal?: AbortSignal,
): Promise<SuggestResponse> => {
  // cancelling has to behave the same way it does against the real engine, or
  // the cancel path is only ever exercised in production
  const wait = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });

  // the recorded id matches no audit entry, which is correct: there is no
  // request behind it, and the progress watch finds nothing to report
  onAccepted(FIXTURE_REQUEST_ID);

  await wait(FIXTURE_DELAY_MS);
  const preview = fixtureSuggestResponse();
  preview.phase = "provisional";
  // the preview carries neither the rating, nor what the rating is measured on,
  // nor the timings of the stages that have not run - and not the merge radius
  // either, so nothing is judged scattered a frame before the order settles
  delete preview.margin;
  delete preview.contextEvaluated;
  delete preview.log;
  delete preview.mergeRadiusKm;
  onProvisional(preview);

  await wait(FIXTURE_PROVISIONAL_GAP_MS);
  return fixtureSuggestResponse();
};

/**
 * Subscribes to the engine's live audit stream and reports the running stage of
 * one request.
 *
 * Keyed on `requestId` from the stream's `accepted` frame, which is the `id` on
 * the audit entries. That identifies the request rather than the browser, so two
 * requests from one browser no longer have to be told apart by their start times.
 *
 * The stream is process-global - every client's entries arrive and are filtered
 * here - so nothing carried on it may be treated as private.
 *
 * Returns a function that closes the subscription.
 */
/** What the engine says about a running request, as one snapshot. */
export interface EngineProgress {
  stage: string | null;
  answered: Record<string, number>;
  failed: Record<string, string>;
  excluded: Record<string, string>;
  /**
   * The name forms this request will search, once the engine has decided them.
   *
   * Empty until the naming phase ends, which is about ten seconds before any
   * coordinate exists — and they are what the rest of the run is built on, so
   * they answer "did it understand the place I meant" while there is still time
   * for the answer to matter.
   */
  candidates: StreamCandidate[];
}

export const watchEngineProgress = (
  requestId: string,
  onProgress: (progress: EngineProgress) => void,
): (() => void) => {
  if (!ENGINE_URL) {
    return () => undefined;
  }
  let source: EventSource;
  try {
    source = new EventSource(`${ENGINE_URL}/state/stream`);
  } catch {
    return () => undefined;
  }

  source.onmessage = (event) => {
    try {
      const { audit } = JSON.parse(event.data) as { audit: EngineAuditEntry[] };
      const live = audit.find((entry) => entry.id === requestId);
      if (!live) {
        return;
      }
      // each frame carries the complete state rather than a change since the
      // last one, so a dropped or late frame costs nothing and nothing here
      // accumulates
      onProgress({
        stage: live.lastLog || null,
        answered: live.sourcesAnswered || {},
        failed: live.sourcesFailed || {},
        excluded: live.sourcesExcluded || {},
        candidates: live.candidates || [],
      });
    } catch {
      /* a malformed frame is not worth tearing the stream down for */
    }
  };
  // the stream reconnects on its own; an error only matters if it never recovers,
  // and the elapsed counter carries the UI in the meantime
  source.onerror = () => undefined;

  return () => source.close();
};

export const __testing = { consumeSuggestStream, fixtureStream };
