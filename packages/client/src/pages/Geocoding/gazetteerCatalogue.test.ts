import { describe, expect, it } from "vitest";
import { EngineSuggester } from "./engineTypes";
import {
  ALL_SOURCES,
  LLM_SOURCE,
  footprintFigure,
  footprintNote,
  gazetteerRows,
  isHealthy,
  withSource,
} from "./gazetteerCatalogue";

/**
 * The gazetteer list the two settings screens draw, and the measurement each
 * row carries.
 *
 * The measurement is the half of the decision that cannot be made from the
 * name, so these assert that a source with no local records is never drawn as
 * though it had been measured — that difference is exactly what the engine
 * scores the region dimension on.
 */

const suggester = (name: string, over: Partial<EngineSuggester> = {}): EngineSuggester =>
  ({
    name,
    category: "file",
    coverage: {},
    health: { status: "ready" },
    weight: { default: 1, min: 0.5 },
    footprint: null,
    info: {},
    ...over,
  }) as EngineSuggester;

describe("gazetteerRows", () => {
  it("lists every source the page knows even with no engine", () => {
    const rows = gazetteerRows(undefined);
    expect(rows.map((row) => row.name)).toEqual(ALL_SOURCES);
    expect(rows.every((row) => row.suggester === undefined)).toBe(true);
  });

  it("keeps the static order rather than the engine's, so rows do not move", () => {
    const rows = gazetteerRows([suggester("native-land"), suggester("wikidata")]);
    expect(rows.map((row) => row.name)).toEqual(ALL_SOURCES);
  });

  /**
   * The engine owns this list. A source it has grown that the static list has
   * never heard of must still get a switch, or there is no way to turn it off.
   */
  it("appends a source the engine has that this page has not heard of", () => {
    const rows = gazetteerRows([suggester("brand-new")]);
    expect(rows.map((row) => row.name)).toContain("brand-new");
    expect(rows[rows.length - 1].name).toBe("brand-new");
  });

  it("puts the model's own guess last, apart from the gazetteers", () => {
    expect(ALL_SOURCES[ALL_SOURCES.length - 1]).toBe(LLM_SOURCE);
  });
});

describe("what the engine measured", () => {
  it("gives the two figures where there are records to count", () => {
    const measured = suggester("sedac-india", { footprint: { records: 621528, cells: 340 } });
    expect(footprintFigure(measured)).toBe("622k · 340 cells");
    expect(footprintNote(measured)).toContain("621,528 records");
  });

  /**
   * A source with no local records is not measured but declared, and the engine
   * scores a declaration below a measurement. Drawing it as `0 · 0 cells` would
   * say the opposite — that it was measured and found empty.
   */
  /**
   * Cells are the whole of what the column says. Rounded to thousands, a source
   * about everywhere and thin reads exactly like one about a single country.
   */
  it("keeps the cell count exact, where the record count is rounded", () => {
    const thin = suggester("native-land", { footprint: { records: 2057, cells: 1292 } });
    const concentrated = suggester("sedac", { footprint: { records: 621528, cells: 340 } });
    expect(footprintFigure(thin)).toBe("2k · 1,292 cells");
    expect(footprintFigure(concentrated)).toBe("622k · 340 cells");
    expect(footprintFigure(thin)).not.toBe(footprintFigure(concentrated));
  });

  it("says a source was declared rather than measured where nothing was counted", () => {
    expect(footprintFigure(suggester("gov"))).toBe("declared");
    expect(footprintNote(suggester("gov"))).toContain("declares");
  });

  it("says nothing is known when the engine was never reached", () => {
    expect(footprintFigure(undefined)).toBe("—");
    expect(footprintNote(undefined)).toContain("not been reached");
  });
});

describe("isHealthy", () => {
  it("reads an unreachable engine as no complaint rather than as illness", () => {
    expect(isHealthy(undefined)).toBe(true);
  });

  it("reports what the engine says about a source that cannot answer", () => {
    expect(isHealthy(suggester("tgn", { health: { status: "unavailable" } }))).toBe(false);
  });
});

describe("withSource", () => {
  it("switches one off and back on", () => {
    expect(withSource([], "gov", true)).toEqual(["gov"]);
    expect(withSource(["gov"], "gov", false)).toEqual([]);
  });

  /**
   * The stored list is compared against the other layer's and against what was
   * saved, so two orderings of the same refusal must not read as a change.
   */
  it("keeps one form for one set, whatever order it was built in", () => {
    expect(withSource(["gov"], "chgis", true)).toEqual(withSource(["chgis"], "gov", true));
  });

  it("switching one off twice is switching it off", () => {
    expect(withSource(["gov"], "gov", true)).toEqual(["gov"]);
  });
});
