import { IGeocodingContext } from "@inkvisitor/shared/types/geocoding";
import { useCallback, useEffect, useRef, useState } from "react";
import { EngineProgress, engineSuggestStream, watchEngineProgress } from "./engine";
import { StreamCandidate, SuggestRequest, SuggestResponse } from "./engineTypes";
import {
  contextLanguages,
  disabledSourcesToSend,
  regionBoxToSend,
  regionToSend,
  weightsToSend,
} from "./geocodingContextFields";

/**
 * Running one `/suggest` and reporting on it while it runs.
 *
 * At most one request is in flight, because the page geocodes the one Location
 * the researcher has selected. The engine now publishes a `requestId` on the
 * stream's opening frame, so concurrent requests could be told apart on the
 * progress stream; nothing here needs them.
 *
 * The response is held until the researcher accepts or rejects it, because
 * `POST /feedback` requires the whole `suggestions` array back even on a
 * rejection.
 */

export interface UseGeocodingSuggest {
  response: SuggestResponse | null;
  /**
   * The Location this response was fetched for. Keyed on the entity id rather
   * than the name, because a corpus contains several places called "Roma" and a
   * name would let two of them swap answers.
   */
  responseFor: string | null;
  /**
   * The context this response was fetched under.
   *
   * Kept because the context is editable while the answer is on screen: an
   * answer found under "region: europe" is not an answer to a question that now
   * says "region: asia", and only the context it actually ran with can say so.
   */
  responseContext: IGeocodingContext | null;
  isRunning: boolean;
  /** Seconds since the request started — the only honest progress on its own. */
  elapsedMs: number;
  /** The engine's current pipeline stage, from the live audit stream. */
  stage: string | null;
  /**
   * What the engine says about the sources, as a snapshot.
   *
   * Every frame carries the complete state, so nothing here accumulates and a
   * dropped frame costs nothing. `excluded` is complete before any source has
   * answered, which is what lets the board draw its full width at once.
   */
  sources: Pick<EngineProgress, "answered" | "failed" | "excluded">;
  /**
   * The name forms the running request will search.
   *
   * Empty before the naming phase ends, and empty for a request answered from
   * the engine's cache — that returns before there is anything to watch, and
   * carries its forms on the response instead.
   */
  candidates: StreamCandidate[];
  /**
   * True while showing the preview frame, before the language model has rated
   * the top suggestions. The list is not merely missing a field at this point —
   * its ORDER is not final. Never true for a query the engine answers from its
   * cache, which arrives settled and in one piece.
   */
  isProvisional: boolean;
  error: string | null;
  /** The Location whose request is in flight, or null. */
  runningFor: string | null;
  run: (
    locationId: string,
    name: string,
    context: IGeocodingContext,
  ) => Promise<SuggestResponse | null>;
  cancel: () => void;
  clear: () => void;
}

export const useGeocodingSuggest = (): UseGeocodingSuggest => {
  const [response, setResponse] = useState<SuggestResponse | null>(null);
  const [responseFor, setResponseFor] = useState<string | null>(null);
  const [responseContext, setResponseContext] = useState<IGeocodingContext | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningFor, setRunningFor] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stage, setStage] = useState<string | null>(null);
  const [sources, setSources] = useState<UseGeocodingSuggest["sources"]>({
    answered: {},
    failed: {},
    excluded: {},
  });
  const [candidates, setCandidates] = useState<StreamCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProvisional, setIsProvisional] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const stopWatchingRef = useRef<(() => void) | null>(null);

  // abandon anything in flight when the page goes away, so neither the request
  // nor the stream outlives the component
  useEffect(
    () => () => {
      abortRef.current?.abort();
      stopWatchingRef.current?.();
    },
    [],
  );

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    return () => clearInterval(timer);
  }, [isRunning]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    // nothing may reclaim this run's state afterwards, and its opening frame is
    // no longer worth subscribing to
    abortRef.current = null;
    stopWatchingRef.current?.();
    stopWatchingRef.current = null;
    setIsRunning(false);
    setRunningFor(null);
    setStage(null);
  }, []);

  const run = useCallback(
    async (locationId: string, name: string, context: IGeocodingContext) => {
      // one at a time; a second press replaces the first rather than racing it
      abortRef.current?.abort();
      stopWatchingRef.current?.();

      const controller = new AbortController();
      abortRef.current = controller;
      /**
       * Whether this call is still the one the page is waiting for.
       *
       * A request abandoned for another Location keeps running until its abort
       * lands, and everything after that - the opening frame, the rejection, the
       * cleanup - arrives once the replacement has already claimed the state.
       * Unguarded, the abandoned request's cleanup switches off the replacement's
       * progress line and leaves a subscription open with nothing holding it.
       */
      const isCurrent = () => abortRef.current === controller;
      setIsRunning(true);
      setRunningFor(locationId);
      setElapsedMs(0);
      setStage(null);
      setSources({ answered: {}, failed: {}, excluded: {} });
      setCandidates([]);
      setError(null);
      setResponse(null);
      setResponseFor(null);
      setResponseContext(null);
      setIsProvisional(false);

      // a drawn box and a named region are mutually exclusive on the engine —
      // both together is a 422 rather than a merge — so `regionToSend` yields
      // nothing whenever a box is in force
      const languages = contextLanguages(context);
      const query: SuggestRequest = {
        name,
        region: regionToSend(context),
        regionBbox: regionBoxToSend(context),
        period: context.period,
        language: languages.length ? languages : undefined,
        place_type: context.placeType,
        contextWeights: weightsToSend(context),
        disabledSources: disabledSourcesToSend(context),
        taskCategory: context.taskCategory,
        dedupeDiacritics: context.dedupeDiacritics,
      };

      try {
        const result = await engineSuggestStream(
          query,
          // shown as soon as the gazetteers have answered, a second or two
          // before the rating lands; the engine skips it entirely when the
          // answer is already in its cache
          (provisional) => {
            setResponse(provisional);
            setResponseFor(locationId);
            setResponseContext(context);
            setIsProvisional(true);
          },
          // the opening frame arrives before any work begins, so the stage line
          // is following this request from its first millisecond
          (requestId) => {
            if (!isCurrent()) {
              return;
            }
            stopWatchingRef.current?.();
            stopWatchingRef.current = watchEngineProgress(requestId, (progress) => {
              setStage(progress.stage);
              setSources({
                answered: progress.answered,
                failed: progress.failed,
                excluded: progress.excluded,
              });
              setCandidates(progress.candidates);
            });
          },
          controller.signal,
        );
        // replaced, not merged: the rating re-sorts the list, so patching the
        // fields of what is on screen would render an order the engine
        // disagrees with
        setResponse(result);
        setResponseFor(locationId);
        setResponseContext(context);
        setIsProvisional(false);
        return result;
      } catch (err) {
        // cancelling is the researcher's own doing and is not a failure
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "The geocoding engine did not answer.");
        }
        return null;
      } finally {
        if (isCurrent()) {
          setIsRunning(false);
          setRunningFor(null);
          setStage(null);
          stopWatchingRef.current?.();
          stopWatchingRef.current = null;
        }
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setResponse(null);
    setResponseFor(null);
    setResponseContext(null);
    setError(null);
    setIsProvisional(false);
  }, []);

  return {
    response,
    responseFor,
    responseContext,
    runningFor,
    isRunning,
    elapsedMs,
    stage,
    sources,
    candidates,
    error,
    isProvisional,
    run,
    cancel,
    clear,
  };
};
