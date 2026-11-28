import React, { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { defaultCiteWithinKm, GeocodingRepresentative } from "@inkvisitor/shared/types/geocoding";
import { render, Rendered } from "../../utils/test/renderForTest";
import { CitingSettings, RULES, ruleSummary } from "./CitingSettings";
import {
  CASES,
  FigureCase,
  FigureRecord,
  MatchType,
  PANELS,
  RecordId,
  TAU,
  verdictOf,
} from "./RepresentativeRules";

/**
 * The rule for a suggestion's coordinate is chosen by name, with what it picks
 * said beside it, and a guide to which rule suits a project opens on request; the
 * guide's figures have to show the record each rule really picks.
 */

let view: Rendered | null = null;

afterEach(() => {
  view?.unmount();
  view = null;
});

const mount = (representative: GeocodingRepresentative | "" = "") => {
  view = render(
    <CitingSettings
      value={{ representative, citeWithinKm: defaultCiteWithinKm() }}
      onChange={() => {}}
    />,
  );
  return view;
};

const buttonWith = (container: HTMLElement, text: string) =>
  [...container.querySelectorAll("button")].find((button) => button.textContent?.includes(text))!;
const guideToggle = (container: HTMLElement) => buttonWith(container, "which rule suits your project");
const regionOf = (container: HTMLElement, toggle: HTMLElement) =>
  container.querySelector<HTMLElement>(`[id="${toggle.getAttribute("aria-controls")}"]`)!;

describe("the rule for a suggestion's coordinate", () => {
  it("names each rule in a few words", () => {
    for (const rule of RULES) {
      expect(rule.label.length).toBeLessThanOrEqual(30);
    }
  });

  it("says beside the choice what the rule chosen picks, and which rule the engine's default is", () => {
    expect(mount("medoid").container.textContent).toContain(ruleSummary("medoid"));
    expect(ruleSummary("medoid")).toBe(PANELS.find((rule) => rule.key === "medoid")!.summary);
    expect(ruleSummary("")).toMatch(/^The engine's own rule, place first: the record/);
  });

  it("keeps the guide closed until it is asked for, and closes it again", () => {
    const { container } = mount();
    const region = () => regionOf(container, guideToggle(container));
    expect(region().hidden).toBe(true);
    act(() => guideToggle(container).click());
    expect(region().hidden).toBe(false);
    expect(region().querySelectorAll("figure")).toHaveLength(PANELS.length);
    expect(guideToggle(container).getAttribute("aria-expanded")).toBe("true");
    act(() => guideToggle(container).click());
    expect(region().hidden).toBe(true);
  });

  it("keeps the case shown when the guide is closed and opened again", () => {
    const { container } = mount();
    act(() => guideToggle(container).click());
    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")].find(
        (one) => one.textContent === label,
      )!;
    act(() => button("deserted villages").click());
    act(() => guideToggle(container).click());
    act(() => guideToggle(container).click());
    expect(button("deserted villages").getAttribute("aria-pressed")).toBe("true");
  });

  it("tables, per rule, how often it found the place and when to choose it and when not", () => {
    const { container } = mount();
    const rows = [...container.querySelectorAll("tbody tr")];
    expect(rows.map((row) => row.querySelector("th")?.textContent)).toEqual(
      PANELS.map((rule) => rule.name),
    );
    expect(rows.map((row) => [...row.querySelectorAll("td")].map((cell) => cell.textContent))).toEqual(
      PANELS.map((rule) => [rule.found, rule.choose, rule.avoid]),
    );
  });

  it("rings in every figure the record its rule picks", () => {
    const { container } = mount();
    act(() => guideToggle(container).click());
    for (const figureCase of CASES) {
      act(() =>
        [...container.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")]
          .find((one) => one.textContent === figureCase.label)!
          .click(),
      );
      expect([...container.querySelectorAll("figure svg[role=img]")].map((svg) => svg.getAttribute("aria-label"))).toEqual(
        PANELS.map((panel) => `${panel.name}: rings the ${figureCase.picks[panel.key]} record`),
      );
    }
  });

  it("keeps how the rules pick in a footnote of the guide, closed until asked for", () => {
    const { container } = mount();
    act(() => guideToggle(container).click());
    const toggle = buttonWith(container, "How a suggestion's coordinate is found");
    expect(regionOf(container, toggle).hidden).toBe(true);
    act(() => toggle.click());
    expect(regionOf(container, toggle).hidden).toBe(false);
    expect(regionOf(container, toggle).textContent).toContain(PANELS[0].how);
  });

  it("lists, for the case shown, the rules that find its place and those that miss it", () => {
    const { container } = mount();
    act(() => guideToggle(container).click());
    const towns = CASES.find((one) => one.key === "towns")!;
    act(() =>
      [...container.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")]
        .find((one) => one.textContent === towns.label)!
        .click(),
    );
    const finding = PANELS.filter((panel) => verdictOf(towns, panel).found).map((panel) => panel.name);
    expect(container.textContent).toContain(`suits: ${finding.join(", ")}`);
    expect(container.textContent).toContain("avoid: best score");
  });
});

/**
 * What hga-engine 0.8.0 knows of each gazetteer drawn: its weight, the confidence
 * it reports, the match types it can return, and how often its record lies on the
 * place itself. `SOURCE_WEIGHTS`, the suggesters' `confidence` and
 * `classifyMatch` fallback, and `POINT_PRECISION`.
 */
const GAZETTEERS: Record<
  RecordId,
  { weight: number; confidence: number | null; matches: MatchType[]; precision: number }
> = {
  wikidata: { weight: 1, confidence: 0.8, matches: ["exact", "alias"], precision: 0.595 },
  tgn: { weight: 1, confidence: 0.8, matches: ["exact", "alias"], precision: 0.409 },
  pleiades: { weight: 1, confidence: 0.8, matches: ["exact", "alias"], precision: 0.793 },
  geonames: { weight: 1, confidence: null, matches: ["exact", "fuzzy"], precision: 0.446 },
  whg: { weight: 0.85, confidence: 0.8, matches: ["exact", "fuzzy"], precision: 0.571 },
  nominatim: { weight: 0.85, confidence: null, matches: ["exact", "fuzzy"], precision: 0.607 },
};

/** hga-engine 0.8.0 `MATCH_TYPE_SCORE`. */
const MATCH_SCORE: Record<MatchType, number> = { exact: 1, alias: 0.75, fuzzy: 0.45 };

/** hga-engine 0.8.0 `matchScore`: weight times match type, lifted by a confidence above a half. */
const matchScore = (record: FigureRecord): number => {
  const gazetteer = GAZETTEERS[record.id];
  const confidence = record.confidence ?? gazetteer.confidence;
  const lift = confidence === null ? 0 : Math.max(0, (confidence - 0.5) * 2);
  return Math.min(1, 0.85 * gazetteer.weight * MATCH_SCORE[record.match] + 0.15 * lift);
};

/**
 * The engine orders equal scores by the record's id in its gazetteer. TGN's ids
 * are numbers and Wikidata's start with "Q", so between those two the order is
 * the same for every place; ties between any others are refused below.
 */
const ID_FORM: Partial<Record<RecordId, string>> = { tgn: "7006097", wikidata: "Q92212" };
const FIXED_TIE = ["tgn", "wikidata"];

/** The engine's order of a group's records: match score, then the record's id. */
const engineOrder = (a: FigureRecord, b: FigureRecord) =>
  matchScore(b) - matchScore(a) || (ID_FORM[a.id] ?? "").localeCompare(ID_FORM[b.id] ?? "");

const distance = (a: FigureRecord, b: FigureRecord) => Math.hypot(a.x - b.x, a.y - b.y);
/** The record quality: the match score times the name form's prior. */
const quality = (record: FigureRecord) => matchScore(record) * (0.5 + 0.5 * record.nameScore);
/** A record's weight in `agreement`'s vote, quality to the power β = 2. */
const agreementWeight = (record: FigureRecord) => quality(record) ** 2;
/** The same in `place first`: also its gazetteer's point precision squared and its name form's score cubed. */
const placeWeight = (record: FigureRecord) =>
  agreementWeight(record) * GAZETTEERS[record.id].precision ** 2 * record.nameScore ** 3;

/** The engine's `argmax`: the first in its order with the highest value. */
const argmax = (pool: FigureRecord[], value: (record: FigureRecord) => number) =>
  pool.reduce((best, record) => (value(record) > value(best) + 1e-12 ? record : best));

/**
 * hga-engine 0.8.0 `pickRepresentative` applied to a case. With one record per
 * gazetteer a gazetteer's vote is its one record's.
 */
const picksOf = (figureCase: FigureCase): Record<GeocodingRepresentative, RecordId> => {
  const ordered = [...figureCase.records].sort(engineOrder);
  const votes = (weight: (record: FigureRecord) => number) => (candidate: FigureRecord) =>
    ordered.reduce((sum, record) => sum + weight(record) * Math.exp(-distance(candidate, record) / TAU), 0);
  const own = ordered.filter((record) => !record.around);
  return {
    "best-score": ordered[0].id,
    agreement: argmax(ordered, votes(agreementWeight)).id,
    "place-first": argmax(own.length ? own : ordered, votes(placeWeight)).id,
    medoid: argmax(ordered, (record) => -ordered.reduce((sum, other) => sum + distance(record, other), 0)).id,
    densest: argmax(
      ordered,
      (record) => ordered.filter((other) => distance(record, other) <= TAU / 2).length,
    ).id,
  };
};

const RULES_DRAWN = PANELS.map((panel) => panel.key);

/** Whether two records tie, with the order between them left to their ids. */
const settledById = (tied: FigureRecord[]) => {
  const top = tied.filter((record) => matchScore(record) === Math.max(...tied.map(matchScore)));
  return top.length > 1 ? top.map((record) => record.id).sort() : [];
};

describe.each(CASES.map((figureCase) => [figureCase.key, figureCase] as const))(
  "the %s case",
  (_key, figureCase) => {
    it("is one suggestion: every record within the engine's grouping radius, 2.5 τ, of every other", () => {
      for (const a of figureCase.records) {
        for (const b of figureCase.records) {
          expect(distance(a, b)).toBeLessThanOrEqual(2.5 * TAU);
        }
      }
    });

    it("has one record per gazetteer, as the vote model above assumes", () => {
      const ids = figureCase.records.map((record) => record.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("rings, under every rule, the record the engine picks", () => {
      const engine = picksOf(figureCase);
      for (const key of RULES_DRAWN) {
        expect([key, figureCase.picks[key]]).toEqual([key, engine[key]]);
      }
    });

    it("gives every record a match type its gazetteer can return", () => {
      for (const record of figureCase.records) {
        expect([record.id, GAZETTEERS[record.id].matches]).toEqual([
          record.id,
          expect.arrayContaining([record.match]),
        ]);
      }
    });

    it("rests a pick on equal scores only between TGN and Wikidata, whose ids order them the same for every place", () => {
      const top = settledById(figureCase.records);
      expect(top.length === 0 || top.join() === FIXED_TIE.join()).toBe(true);
      const counts = figureCase.records.map(
        (record) => figureCase.records.filter((other) => distance(record, other) <= TAU / 2).length,
      );
      const most = Math.max(...counts);
      const densest = settledById(figureCase.records.filter((_, index) => counts[index] === most));
      expect(densest.length === 0 || densest.join() === FIXED_TIE.join()).toBe(true);
    });
  },
);

describe("the cases together", () => {
  it("are named in the guide's table: choose a rule for the cases whose place it finds, avoid it for the rest", () => {
    for (const panel of PANELS) {
      for (const figureCase of CASES) {
        const found = verdictOf(figureCase, panel).found;
        expect([panel.key, figureCase.label, panel.choose.includes(figureCase.label)]).toEqual([
          panel.key,
          figureCase.label,
          found,
        ]);
        expect([panel.key, figureCase.label, panel.avoid.includes(figureCase.label)]).toEqual([
          panel.key,
          figureCase.label,
          !found,
        ]);
      }
    }
  });


  it("show no rule finding the place in every case", () => {
    for (const panel of PANELS) {
      const found = CASES.map((figureCase) => verdictOf(figureCase, panel).found);
      expect([panel.key, found.includes(false)]).toEqual([panel.key, true]);
    }
  });

  it("have a rule that finds the place in every case", () => {
    for (const figureCase of CASES) {
      const found = PANELS.map((panel) => verdictOf(figureCase, panel).found);
      expect([figureCase.key, found.includes(true)]).toEqual([figureCase.key, true]);
    }
  });

  it("include the tie best score settles for TGN, the way it misses most often", () => {
    const towns = CASES.find((one) => one.key === "towns")!;
    expect(settledById(towns.records)).toEqual(FIXED_TIE);
    expect(verdictOf(towns, PANELS.find((panel) => panel.key === "best-score")!).found).toBe(false);
  });
});
