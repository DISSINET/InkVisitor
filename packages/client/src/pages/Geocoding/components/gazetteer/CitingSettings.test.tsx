import React, { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { defaultCiteWithinKm } from "@inkvisitor/shared/types/geocoding";
import { render, Rendered } from "../../utils/test/renderForTest";
import { CitingSettings, RULES } from "./CitingSettings";
import {
  CASES,
  FigureCase,
  FigureRecord,
  GAZETTEERS,
  PANELS,
  RecordId,
  TAU,
  agreementWeight,
  matchScore,
  placeWeight,
  vote,
} from "./RepresentativeRules";

/**
 * The rule for a suggestion's coordinate is chosen by name, and what each rule
 * does is drawn on request; the drawing has to show the record each rule really
 * picks.
 */

let view: Rendered | null = null;

afterEach(() => {
  view?.unmount();
  view = null;
});

const mount = () => {
  view = render(
    <CitingSettings
      value={{ representative: "", citeWithinKm: defaultCiteWithinKm() }}
      onChange={() => {}}
    />,
  );
  return view;
};

const toggle = (container: HTMLElement) =>
  [...container.querySelectorAll("button")].find((button) =>
    button.textContent?.includes("how the rules work"),
  )!;

describe("the rule for a suggestion's coordinate", () => {
  it("names each rule in a few words", () => {
    for (const rule of RULES) {
      expect(rule.label.length).toBeLessThanOrEqual(30);
    }
  });

  it("keeps the explanation closed until it is asked for, and closes it again", () => {
    const { container } = mount();
    const region = () =>
      container.querySelector<HTMLElement>(`[id="${toggle(container).getAttribute("aria-controls")}"]`)!;
    expect(region().hidden).toBe(true);
    act(() => toggle(container).click());
    expect(region().hidden).toBe(false);
    expect(region().querySelectorAll("figure")).toHaveLength(PANELS.length);
    expect(toggle(container).getAttribute("aria-expanded")).toBe("true");
    act(() => toggle(container).click());
    expect(region().hidden).toBe(true);
  });

  it("keeps the case shown when the explanation is closed and opened again", () => {
    const { container } = mount();
    act(() => toggle(container).click());
    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button[aria-pressed]")].find(
        (one) => one.textContent === label,
      )!;
    act(() => button("village and its municipality").click());
    act(() => toggle(container).click());
    act(() => toggle(container).click());
    expect(button("village and its municipality").getAttribute("aria-pressed")).toBe("true");
  });
});

/**
 * hga-engine 0.8.0 `pickRepresentative` applied to each case, with the vote
 * weights the figures draw. With one record per gazetteer a gazetteer's vote is
 * its one record's.
 */
const distance = (a: FigureRecord, b: FigureRecord) => Math.hypot(a.x - b.x, a.y - b.y);
const argmax = (pool: FigureRecord[], value: (record: FigureRecord) => number) =>
  pool.reduce((best, record) => (value(record) > value(best) + 1e-12 ? record : best));

const picksOf = (figureCase: FigureCase): Record<string, RecordId> => {
  const records = figureCase.records;
  // the engine's order: match score first; the cases hold no tie it would settle by record id
  const ordered = [...records].sort((a, b) => matchScore(b) - matchScore(a));
  const votes = (weight: (record: FigureRecord) => number) => (candidate: FigureRecord) =>
    records.reduce((sum, record) => sum + vote(weight, record, candidate), 0);
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

    it("decides no pick by equal scores, which the engine settles by record id", () => {
      const scores = figureCase.records.map(matchScore);
      const top = Math.max(...scores);
      expect(scores.filter((score) => score === top)).toHaveLength(1);
      const counts = figureCase.records.map(
        (record) => figureCase.records.filter((other) => distance(record, other) <= TAU / 2).length,
      );
      const most = Math.max(...counts);
      const tied = figureCase.records.filter((_, index) => counts[index] === most).map(matchScore);
      expect(tied.filter((score) => score === Math.max(...tied))).toHaveLength(1);
    });

  },
);

describe("the cases together", () => {
  it("show every rule finding the place in one case and missing it in another", () => {
    for (const key of RULES_DRAWN) {
      const found = CASES.map((figureCase) => figureCase.right.includes(figureCase.picks[key]));
      expect([key, found.includes(true), found.includes(false)]).toEqual([key, true, true]);
    }
  });
});
