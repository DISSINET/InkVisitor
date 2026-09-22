import { describe, expect, it } from "vitest";
import { EngineParameters } from "./engineTypes";
import {
  CUSTOM_REGION,
  QUERY_FIELDS,
  contextLanguages,
  contextOptions,
  NEUTRAL_STEP,
  WEIGHT_STEPS,
  contextWeight,
  disabledSourcesToSend,
  optionLabel,
  queryContextChanged,
  regionBoxToSend,
  regionOptions,
  regionToSend,
  regionValue,
  stepToWeight,
  weightToStep,
  weightsToSend,
} from "./geocodingContextFields";

/**
 * The four fields the engine is asked a question with, and the two things the
 * panel needs of them: a list to choose from that never loses the value it
 * already holds, and a comparison that says when an answer has gone stale.
 */

const parameters = {
  regions: [{ id: "europe", label: "Europe", bbox: [0, 0, 1, 1] }],
  periods: [{ id: "1200-1400", label: "1200-1400" }],
  languages: [{ id: "de", label: "German" }],
  placeTypes: [{ id: "settlement", label: "Settlement" }],
} as unknown as EngineParameters;

describe("contextOptions", () => {
  it("offers the vocabulary the engine published, under a blank", () => {
    expect(contextOptions(parameters, "region", undefined)).toEqual([
      { value: "", label: "—" },
      { value: "europe", label: "Europe" },
    ]);
  });

  it("keeps the value already held when the engine has never heard of it", () => {
    // a vocabulary that changed under a stored value, and the stored value is
    // still what the engine will be sent
    const options = contextOptions(parameters, "region", "occitania");
    expect(options.map((option) => option.value)).toContain("occitania");
  });

  it("keeps the value already held when the engine cannot be reached at all", () => {
    // the whole point: with no vocabularies, a field drawn without its own
    // value reads as blank, and the next press on it blanks it for real
    const options = contextOptions(undefined, "language", "de");
    expect(options.map((option) => option.value)).toEqual(["", "de"]);
  });

  it("does not repeat a value that is already in the vocabulary", () => {
    const options = contextOptions(parameters, "language", "de");
    expect(options.filter((option) => option.value === "de")).toHaveLength(1);
  });
});

describe("optionLabel", () => {
  it("names a value from the engine's vocabulary", () => {
    expect(optionLabel(parameters, "placeType", "settlement")).toBe("Settlement");
  });

  it("falls back to the id where nothing can name it", () => {
    expect(optionLabel(undefined, "placeType", "settlement")).toBe("settlement");
  });

  it("draws nothing chosen the same way the list does", () => {
    expect(optionLabel(parameters, "region", undefined)).toBe("—");
  });
});

describe("queryContextChanged", () => {
  it("is false where the four query fields agree", () => {
    expect(
      queryContextChanged(
        { region: "europe", language: "de" },
        { region: "europe", language: "de" },
      ),
    ).toBe(false);
  });

  it("is true where any one of them differs", () => {
    for (const field of QUERY_FIELDS) {
      expect(queryContextChanged({ [field]: "a" }, { [field]: "b" })).toBe(true);
    }
  });

  it("reads an absent field and a blank one as the same claim", () => {
    // the engine is told nothing either way, so an answer found under one is an
    // answer to the other and must not offer to run again
    expect(queryContextChanged({ region: undefined }, { region: "" })).toBe(false);
  });

  it("ignores everything that is not part of the question", () => {
    // running again cannot change these, and offering to would be noise
    expect(
      queryContextChanged(
        { region: "europe", autoSearch: true, taskCategory: "quick" },
        { region: "europe", autoSearch: false, taskCategory: "quality" },
      ),
    ).toBe(false);
  });

  /**
   * It is not one of the panel's four fields, but it changes which name forms
   * the engine searches — so an answer produced under the other setting is an
   * answer to a different question, and the panel has to offer to run again.
   */
  it("counts a change to accent folding, which is not a panel field", () => {
    expect(queryContextChanged({ dedupeDiacritics: false }, { dedupeDiacritics: true })).toBe(true);
    expect(queryContextChanged({}, { dedupeDiacritics: true })).toBe(true);
  });

  it("treats unset and off as the same setting, which is what the engine does", () => {
    expect(queryContextChanged({}, { dedupeDiacritics: false })).toBe(false);
  });
});

describe("contextLanguages", () => {
  it("reads the list the field now holds", () => {
    expect(contextLanguages({ languages: ["de", "pl"] })).toEqual(["de", "pl"]);
  });

  /**
   * A context saved before the field took several still carries one language on
   * its own key. Without this, every such researcher's language would silently
   * stop being sent — the engine reads an absent field as no constraint, so
   * nothing would look wrong.
   */
  it("falls back to the single value a context saved earlier carries", () => {
    expect(contextLanguages({ language: "de" })).toEqual(["de"]);
  });

  it("prefers the list where a context carries both", () => {
    expect(contextLanguages({ language: "de", languages: ["la"] })).toEqual(["la"]);
  });

  it("says nothing where nothing is set", () => {
    expect(contextLanguages({})).toEqual([]);
    expect(contextLanguages({ languages: [] })).toEqual([]);
  });
});

describe("what a request carries for the region", () => {
  /**
   * The engine refuses a request naming a region and drawing one with 422
   * rather than reconciling them, so this is the one place that refusal is made
   * unreachable. It would fail if the box and the name were both passed through.
   */
  it("sends the drawn box alone, never the name beside it", () => {
    const context = { region: "europe", regionBbox: [1, 2, 3, 4] as [number, number, number, number] };
    expect(regionToSend(context)).toBeUndefined();
    expect(regionBoxToSend(context)).toEqual([1, 2, 3, 4]);
  });

  it("sends the named region where nothing is drawn", () => {
    expect(regionToSend({ region: "europe" })).toBe("europe");
    expect(regionBoxToSend({ region: "europe" })).toBeUndefined();
  });

  it("keeps the name stored under a box, so clearing the box gives it back", () => {
    const context = { region: "europe", regionBbox: [1, 2, 3, 4] as [number, number, number, number] };
    expect(regionToSend({ ...context, regionBbox: null })).toBe("europe");
  });

  it("names the drawn region in the picker, and only while one is drawn", () => {
    expect(regionValue({ region: "europe" })).toBe("europe");
    expect(regionValue({ region: "europe", regionBbox: [1, 2, 3, 4] })).toBe(CUSTOM_REGION);
    expect(regionOptions(undefined, { region: "europe" }).map((one) => one.value)).not.toContain(
      CUSTOM_REGION,
    );
    expect(
      regionOptions(undefined, { regionBbox: [1, 2, 3, 4] }).map((one) => one.value),
    ).toContain(CUSTOM_REGION);
  });
});

describe("the weights", () => {
  it("falls back to the engine's own default, region counting double", () => {
    expect(contextWeight({}, "region")).toBe(2);
    expect(contextWeight({}, "period")).toBe(1);
    expect(contextWeight({ contextWeights: { region: 0 } }, "region")).toBe(0);
  });

  /**
   * The weights are part of the engine's cache key, so a request stating the
   * defaults in full asks the same question from a second cache entry. Without
   * this, every request would carry them and nothing would ever be a cache hit.
   */
  it("sends nothing where every dimension sits at its default", () => {
    expect(weightsToSend({})).toBeUndefined();
    expect(weightsToSend({ contextWeights: { region: 2, period: 1 } })).toBeUndefined();
  });

  it("sends only the dimensions that were moved", () => {
    expect(weightsToSend({ contextWeights: { region: 4, period: 1 } })).toEqual({ region: 4 });
  });

  it("sends a dimension switched off, which is not the same as not mentioning it", () => {
    // zero removes the dimension from the score and lifts its veto; omitting it
    // leaves the engine's default in force, which is the opposite
    expect(weightsToSend({ contextWeights: { period: 0 } })).toEqual({ period: 0 });
  });
});

describe("queryContextChanged, over the fields the engine grew", () => {
  it("counts a language added or dropped", () => {
    expect(queryContextChanged({ languages: ["de"] }, { languages: ["de", "pl"] })).toBe(true);
    expect(queryContextChanged({ languages: ["de"] }, { languages: ["de"] })).toBe(false);
  });

  it("reads the single-value field and the one-element list as one claim", () => {
    expect(queryContextChanged({ language: "de" }, { languages: ["de"] })).toBe(false);
  });

  it("counts a region drawn, moved or cleared", () => {
    expect(queryContextChanged({}, { regionBbox: [1, 2, 3, 4] })).toBe(true);
    expect(queryContextChanged({ regionBbox: [1, 2, 3, 4] }, { regionBbox: [1, 2, 3, 5] })).toBe(
      true,
    );
    expect(queryContextChanged({ regionBbox: [1, 2, 3, 4] }, { regionBbox: [1, 2, 3, 4] })).toBe(
      false,
    );
  });

  /**
   * The weights decide which sources are asked and how much each counts, so an
   * answer found under one set is not an answer under another — which is why
   * the engine keeps the two under separate cache keys.
   */
  it("counts a weight moved", () => {
    expect(queryContextChanged({}, { contextWeights: { region: 4 } })).toBe(true);
  });

  it("does not count a weight restated at its default", () => {
    expect(queryContextChanged({}, { contextWeights: { region: 2, placeType: 1 } })).toBe(false);
  });
});

/**
 * The slider runs 0 to 10 for every dimension, but the dimensions do not share
 * a default — region counts double. These would fail if the scale were the
 * engine's own numbers: neutral would sit in a different place on every row,
 * and a column of four sliders would say nothing when read down.
 */
describe("the slider's scale", () => {
  it("puts every dimension's own default at the same middle position", () => {
    for (const field of QUERY_FIELDS) {
      expect(weightToStep(contextWeight({}, field), field)).toBe(NEUTRAL_STEP);
    }
  });

  it("sends that dimension's own default from the middle, not one shared number", () => {
    expect(stepToWeight(NEUTRAL_STEP, "region")).toBe(2);
    expect(stepToWeight(NEUTRAL_STEP, "period")).toBe(1);
  });

  it("reaches double the default at the top and nothing at the bottom", () => {
    expect(stepToWeight(WEIGHT_STEPS, "region")).toBe(4);
    expect(stepToWeight(WEIGHT_STEPS, "period")).toBe(2);
    expect(stepToWeight(0, "region")).toBe(0);
  });

  /**
   * A slider dragged away and put back must send nothing, because the weights
   * are part of the engine's cache key. A rounding error of a hundredth would
   * make every such request a cache miss and change no answer.
   */
  it("round-trips every position back to a weight the request omits", () => {
    for (const field of QUERY_FIELDS) {
      const back = stepToWeight(weightToStep(contextWeight({}, field), field), field);
      expect(weightsToSend({ contextWeights: { [field]: back } })).toBeUndefined();
    }
  });
});

describe("the gazetteers a request refuses", () => {
  it("says nothing where nothing is switched off", () => {
    // a project that has never opened either screen sends what it always sent
    expect(disabledSourcesToSend({})).toBeUndefined();
    expect(disabledSourcesToSend({ disabledSources: [] })).toBeUndefined();
  });

  it("names them where some are", () => {
    expect(disabledSourcesToSend({ disabledSources: ["llm-coords"] })).toEqual(["llm-coords"]);
  });

  /**
   * A source switched off was not asked, so an answer found with it is not an
   * answer to a question that excludes it — and one switched back on has not
   * been asked yet.
   */
  it("makes an answer on screen stale", () => {
    expect(queryContextChanged({}, { disabledSources: ["gov"] })).toBe(true);
    expect(
      queryContextChanged({ disabledSources: ["gov"] }, { disabledSources: ["gov"] }),
    ).toBe(false);
  });
});
