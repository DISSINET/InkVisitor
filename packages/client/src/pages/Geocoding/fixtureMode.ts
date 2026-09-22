import { SuggestResponse } from "./engineTypes";
import breslau from "./fixtures/suggest-breslau.json";

/**
 * Serving a committed response instead of calling the engine.
 *
 * A real `/suggest` takes five to ten seconds, and the engine's cache only
 * shortens the second look at a query nobody is changing. Building or adjusting
 * anything that renders the output costs that much per look. This replaces the
 * call with a recorded one.
 *
 * Development only, and deliberately so: fixture data reaching a researcher
 * would be indistinguishable from a real answer and would be wrong about a real
 * place. The check is on the build's own environment, not on a flag anyone can
 * set, so a production bundle cannot be talked into it.
 */

const STORAGE_KEY = "geocodingFixtureMode";
const PARAM = "fixture";

const isDevelopment = () => process.env.ENV === "development";

/** True where the toggle may be offered at all. */
export const fixtureModeAvailable = (): boolean => isDevelopment();

/**
 * On when `?fixture=1` is in the URL, or when it was last turned on. The URL
 * wins where present, so a link can still set it either way.
 */
export const isFixtureMode = (): boolean => {
  if (!isDevelopment()) {
    return false;
  }
  try {
    const param = new URLSearchParams(window.location.search).get(PARAM);
    if (param !== null) {
      const on = param === "1" || param === "true";
      window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
      return on;
    }
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // a browser that refuses site data still honours the URL parameter above
    return false;
  }
};

/**
 * The recorded response. A genuine one for `Breslau · de · 1200–1400 · Silesia ·
 * city`, so it carries the awkward cases a hand-written stub would smooth over:
 * 14 of its 25 suggestions are off-region, a source reports `ran` with no
 * results while five report `skipped`, 41 of 118 matches carry attested years
 * and the rest none, and two suggestions are scattered enough to be flagged -
 * Wrocław among them, at 15.8 km, because its sources include the airport and
 * the football stadium.
 */
export const fixtureSuggestResponse = (): SuggestResponse =>
  JSON.parse(JSON.stringify(breslau)) as SuggestResponse;

/**
 * Enough delay to see a pending state, far short of a real query.
 * Without any wait the progress UI would never render during development and
 * would first be seen by a researcher.
 */
export const FIXTURE_DELAY_MS = 1200;

/**
 * How long the recorded preview stands before the answer replaces it. Long
 * enough to read the banner, which is the only reason the preview is rendered
 * at all.
 */
export const FIXTURE_PROVISIONAL_GAP_MS = 900;

/**
 * Stands in for the `requestId` the engine's `accepted` frame carries. It
 * matches no audit entry, which is right - there is no request to report the
 * stages of.
 */
export const FIXTURE_REQUEST_ID = "fixture-request";

/**
 * Turns the recorded response on or off from the page itself.
 *
 * Reloads, because the flag is read at call time rather than held in React
 * state — a half-switched page that queried the engine for one place and the
 * fixture for the next would be worse than a moment's reload.
 */
export const setFixtureMode = (on: boolean): void => {
  if (!isDevelopment()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* nothing to persist to; the URL parameter still works */
  }
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAM);
  window.location.href = url.toString();
};
