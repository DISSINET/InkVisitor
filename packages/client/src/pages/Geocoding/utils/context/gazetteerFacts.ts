import type { EngineSuggester } from "../../types/engine";
import type { ChipTone } from "./gazetteerDetails";

/**
 * What a researcher needs to see beside a source before deciding to ask it: what
 * it covers, how long it usually takes and how much it holds.
 *
 * Every function answers null where the engine said nothing, so a row shows what
 * is known and leaves out the rest rather than printing "unknown" three times.
 */

/** A source that usually answers within this is quick. */
export const QUICK_BELOW_MS = 1500;
/** A source that usually takes at least this is slow. */
export const SLOW_FROM_MS = 4000;
/** Failures as a share of the runs that reached the source, from which it is said to fail often. */
export const OFTEN_FAILS_FROM = 0.2;

/** The first sentence of a description, for an engine that publishes no scope. */
const firstSentence = (text: string): string => {
  const end = text.search(/\.(\s|$)/);
  return (end === -1 ? text : text.slice(0, end)).trim();
};

/** Time, geography and topic in one line, or the start of the description where the engine gave no scope. */
export const scopeLine = (suggester: EngineSuggester): string | null => {
  const scope = suggester.info.scope;
  if (scope) {
    return [scope.time, scope.geography, scope.topic].filter(Boolean).join(" · ");
  }
  const description = suggester.info.description?.trim();
  return description ? firstSentence(description) : null;
};

/** Seconds with the precision the figure deserves: 0.4 s, 4.8 s, 12 s. */
const seconds = (ms: number): string => `${ms < 10_000 ? (ms / 1000).toFixed(1) : Math.round(ms / 1000)} s`;

export type SpeedLevel = "local" | "quick" | "moderate" | "slow";

export interface Speed {
  level: SpeedLevel;
  /** The chip's text. */
  label: string;
  tone: ChipTone;
  /** What the figure is, for the card. */
  sentence: string;
}

/**
 * How long a source usually takes, from the engine's own measurement.
 *
 * A local file answers from memory, so it needs no measurement. An online service
 * with none yet says nothing: a guess would be read as a measurement.
 */
export const speedOf = (suggester: EngineSuggester): Speed | null => {
  if (suggester.category === "file") {
    return {
      level: "local",
      label: "local",
      tone: "good",
      sentence: "Answers from records held on the engine, in a few milliseconds.",
    };
  }
  const latency = suggester.latency;
  if (!latency) {
    return null;
  }
  const level: SpeedLevel =
    latency.p50Ms < QUICK_BELOW_MS ? "quick" : latency.p50Ms >= SLOW_FROM_MS ? "slow" : "moderate";
  return {
    level,
    label: `${level} · ${seconds(latency.p50Ms)}`,
    tone: level === "quick" ? "good" : level === "slow" ? "caution" : "neutral",
    sentence:
      `Usually answers in ${seconds(latency.p50Ms)}, and nine in ten within ${seconds(latency.p95Ms)}, ` +
      `over its last ${latency.samples} runs, which searched ${latency.meanCandidates.toFixed(1)} name forms each. ` +
      "More name forms take longer, and a source that waits between requests by its own rule takes longer still.",
  };
};

/** Whether a source failed often enough over its recent runs to be worth saying so. */
export const oftenFails = (suggester: EngineSuggester): { share: number; sentence: string } | null => {
  const latency = suggester.latency;
  if (!latency || latency.failures === 0) {
    return null;
  }
  const share = latency.failures / (latency.samples + latency.failures);
  return share >= OFTEN_FAILS_FROM
    ? {
        share,
        sentence: `Failed or was cut off in ${latency.failures} of its last ${latency.samples + latency.failures} runs.`,
      }
    : null;
};

/** A count as a reader would say it: 2,303 · 621,528 · 3.0 M · 13 M. */
export const formatCount = (count: number): string =>
  count >= 10_000_000
    ? `${Math.round(count / 1_000_000)} M`
    : count >= 1_000_000
      ? `${(count / 1_000_000).toFixed(1)} M`
      : count.toLocaleString("en-US");

export interface Items {
  /** The chip's text. */
  label: string;
  /** What the figure counts, for the card. */
  sentence: string;
}

/**
 * How much a source holds.
 *
 * Taken from the engine's published size; for an engine that publishes none, from
 * the records it found in a local file. A service with neither says nothing.
 */
export const itemsOf = (suggester: EngineSuggester): Items | null => {
  const size = suggester.info.size;
  if (size) {
    if (size.records === null) {
      return null;
    }
    const count = formatCount(size.records);
    return {
      label: `${size.approximate ? "≈ " : ""}${count} records`,
      sentence: `${size.what}${size.asOf ? ` (as of ${size.asOf})` : ""}`,
    };
  }
  const footprint = suggester.footprint;
  return footprint
    ? {
        label: `${formatCount(footprint.records)} located records`,
        sentence: `${footprint.records.toLocaleString("en-US")} records with a coordinate.`,
      }
    : null;
};
