import { describe, expect, it } from "vitest";
import {
  KNOWN_SOURCES,
  PHASE_ORDER,
  PHASE_WORDS,
  advance,
  readSources,
  readStage,
  sourceTally,
} from "./stageProgress";

/**
 * The engine's running commentary is the only thing a request offers between the
 * press and the answer. It owns these strings and will change them, so an
 * unrecognised line has to leave the board standing rather than break it.
 */

describe("readStage", () => {
  it("reads a gazetteer answering, and how much it found", () => {
    expect(readStage("gov: 52 results")).toEqual({ phase: "asking", source: "gov", count: 52 });
  });

  it("keeps a count of zero, which is an answer", () => {
    // a source that ran and found nothing is evidence; the board says so
    expect(readStage("viabundus: 0 results")).toEqual({
      phase: "asking",
      source: "viabundus",
      count: 0,
    });
  });

  it("reads a source that answered for only some of the name forms", () => {
    expect(readStage("wikidata: 7 results (1/3 candidates failed)")).toMatchObject({
      source: "wikidata",
      count: 7,
    });
  });

  it("tells the pipeline's own stages from the gazetteers", () => {
    expect(readStage("suggest: 0 results from 11/16 suggesters").phase).toBe("grouping");
    expect(readStage("evaluate: 207 matches → 99 suggestions").phase).toBe("rating");
    expect(readStage("criteria: region=europe, lang=de").phase).toBe("naming");
  });

  it("names no source for a pipeline stage", () => {
    expect(readStage("evaluate: 207 matches → 99 suggestions").source).toBeUndefined();
  });

  it("leaves the board standing on a line it does not know", () => {
    // the engine owns these strings and will change them
    expect(readStage("polishing: 4 widgets")).toEqual({ phase: "unknown" });
    expect(readStage("something without a colon")).toEqual({ phase: "unknown" });
  });

  it("has something to say before anything has been said", () => {
    expect(readStage(null)).toEqual({ phase: "unknown" });
    expect(readStage("")).toEqual({ phase: "unknown" });
  });
});

describe("advance", () => {
  it("moves the rail forward as the pipeline reports later phases", () => {
    expect(advance(-1, "naming")).toBe(0);
    expect(advance(0, "asking")).toBe(1);
    expect(advance(1, "rating")).toBe(3);
  });

  it("holds its place on a line it cannot read", () => {
    // the engine owns these strings and rewords them; a rail that fell back to
    // the start on an unfamiliar line would read as the request restarting
    expect(advance(2, "unknown")).toBe(2);
  });

  it("holds its place when a phase is reported twice", () => {
    expect(advance(2, "asking")).toBe(2);
  });

  it("counts every phase the words describe", () => {
    expect(PHASE_ORDER.every((phase) => PHASE_WORDS[phase])).toBe(true);
  });
});

describe("readSources", () => {
  const nothing = { answered: {}, failed: {}, excluded: {} };

  it("names every known source whatever the engine has said", () => {
    // the board draws its full width from the first frame, so a source the
    // engine has not mentioned still needs a cell
    expect(readSources(nothing)).toHaveLength(KNOWN_SOURCES.length);
    expect(readSources(nothing).every((one) => one.state === "waiting")).toBe(true);
  });

  it("keeps the known sources in their fixed order", () => {
    expect(readSources(nothing).map((one) => one.source)).toEqual([...KNOWN_SOURCES]);
  });

  it("separates a source that found nothing from one still working", () => {
    const read = readSources({ ...nothing, answered: { gov: 0 } });
    const gov = read.find((one) => one.source === "gov");
    expect(gov).toEqual({ source: "gov", state: "empty", count: 0 });
    expect(read.find((one) => one.source === "wikidata")?.state).toBe("waiting");
  });

  it("carries the engine's reason for an excluded source", () => {
    const read = readSources({
      ...nothing,
      excluded: { pleiades: "skipped: period 1200-1400 outside coverage" },
    });
    expect(read.find((one) => one.source === "pleiades")).toEqual({
      source: "pleiades",
      state: "excluded",
      reason: "skipped: period 1200-1400 outside coverage",
    });
  });

  it("reads a failure as asked-and-did-not-answer, not as excluded", () => {
    const read = readSources({ ...nothing, failed: { wikidata: "cut off at budget" } });
    expect(read.find((one) => one.source === "wikidata")?.state).toBe("failed");
  });

  it("prefers an answer over any other claim about the same source", () => {
    // the three maps are the engine's, and a source that answered has answered
    const read = readSources({
      answered: { gov: 48 },
      failed: { gov: "cut off at budget" },
      excluded: { gov: "skipped" },
    });
    expect(read.find((one) => one.source === "gov")?.state).toBe("answered");
  });
});

/**
 * `llm-coords` is one of `KNOWN_SOURCES`, not an example of a name the client
 * has never heard of — it is a permanent sixteenth suggester the engine
 * always runs (see `stageProgress.ts`), and `theme.color.gazetteer` already
 * carries its colour alongside the fifteen gazetteers'. The board must draw
 * its cell from the first frame precisely because the engine gives no advance
 * notice of *when* it will answer, only that it always does.
 */
describe("readSources, the model's own coordinate guess", () => {
  it("gives llm-coords a cell before it has answered", () => {
    const read = readSources({ answered: {}, failed: {}, excluded: {} });
    expect(read.find((one) => one.source === "llm-coords")).toEqual({
      source: "llm-coords",
      state: "waiting",
    });
  });

  /**
   * The regression this guards: `llm-coords` used to be absent from
   * `KNOWN_SOURCES`, so its row only appeared once it reported, growing the
   * board — and pushing every stage under it down — in the middle of a run.
   */
  it("does not change the board's length when llm-coords reports", () => {
    const before = readSources({ answered: {}, failed: {}, excluded: {} });
    const after = readSources({ answered: { "llm-coords": 3 }, failed: {}, excluded: {} });
    expect(after).toHaveLength(before.length);
  });
});

describe("readSources, a source neither list has ever heard of", () => {
  it("gives a cell to a source the engine named but this client has no entry for", () => {
    // the engine owns the source list and adds to it; a build of this page can
    // predate a suggester the engine has since added
    const read = readSources({
      answered: { "atlas-obscura": 3, gov: 48 },
      failed: {},
      excluded: {},
    });
    expect(read).toHaveLength(KNOWN_SOURCES.length + 1);
    expect(read.find((one) => one.source === "atlas-obscura")).toEqual({
      source: "atlas-obscura",
      state: "answered",
      count: 3,
    });
  });

  it("keeps the known sources first, so the board does not reorder", () => {
    const read = readSources({ answered: { "atlas-obscura": 3 }, failed: {}, excluded: {} });
    expect(read.slice(0, KNOWN_SOURCES.length).map((one) => one.source)).toEqual([
      ...KNOWN_SOURCES,
    ]);
  });

  it("names an unknown source once, however many maps mention it", () => {
    const read = readSources({
      answered: {},
      failed: { "atlas-obscura": "cut off at budget" },
      excluded: { "atlas-obscura": "skipped" },
    });
    expect(read.filter((one) => one.source === "atlas-obscura")).toHaveLength(1);
  });
});

describe("sourceTally", () => {
  it("counts only the sources that will ever report", () => {
    const tally = sourceTally(
      readSources({
        answered: { gov: 48, idai: 0 },
        failed: { wikidata: "cut off at budget" },
        excluded: { pleiades: "skipped", chgis: "skipped" },
      }),
    );
    // three heard from (two answers and a failure), out of the known sources
    // minus the two excluded gazetteers
    expect(tally).toEqual({ heard: 3, expected: KNOWN_SOURCES.length - 2 });
  });

  it("counts a source neither list has ever heard of", () => {
    // the defect this replaced: the tally counted a source the board drew no
    // cell for, so two wrong numbers agreed
    const tally = sourceTally(
      readSources({ answered: { "atlas-obscura": 3 }, failed: {}, excluded: {} }),
    );
    expect(tally).toEqual({ heard: 1, expected: KNOWN_SOURCES.length + 1 });
  });
});
