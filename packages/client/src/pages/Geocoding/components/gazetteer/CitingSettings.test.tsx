import React, { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { defaultCiteWithinKm } from "@inkvisitor/shared/types/geocoding";
import { render, Rendered } from "../../utils/test/renderForTest";
import { CitingSettings, RULES } from "./CitingSettings";
import {
  FigureRecord,
  PANELS,
  RECORDS,
  TAU,
  agreementWeight,
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
    expect(container.querySelectorAll("figure")).toHaveLength(0);
    act(() => toggle(container).click());
    expect(container.querySelectorAll("figure")).toHaveLength(PANELS.length);
    expect(toggle(container).getAttribute("aria-expanded")).toBe("true");
    act(() => toggle(container).click());
    expect(container.querySelectorAll("figure")).toHaveLength(0);
  });
});

/**
 * hga-engine 0.8.0 `pickRepresentative` applied to the example, with the vote
 * weights the figures draw. With one record per gazetteer a gazetteer's vote is
 * its one record's.
 */
const distance = (a: FigureRecord, b: FigureRecord) => Math.hypot(a.x - b.x, a.y - b.y);
// the engine's order, which settles ties: match score, then identifier
const ordered = [...RECORDS].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
const argmax = (pool: FigureRecord[], value: (record: FigureRecord) => number) =>
  pool.reduce((best, record) => (value(record) > value(best) + 1e-12 ? record : best));
const votes = (weight: (record: FigureRecord) => number) => (candidate: FigureRecord) =>
  RECORDS.reduce((sum, record) => sum + vote(weight, record, candidate), 0);

const picks: Record<string, FigureRecord> = {
  "best-score": ordered[0],
  agreement: argmax(ordered, votes(agreementWeight)),
  "place-first": argmax(
    ordered.filter((record) => !record.around),
    votes(placeWeight),
  ),
  medoid: argmax(ordered, (record) => -ordered.reduce((sum, other) => sum + distance(record, other), 0)),
  densest: argmax(
    ordered,
    (record) => ordered.filter((other) => distance(record, other) <= TAU / 2).length,
  ),
};

describe("the example the rules are drawn on", () => {
  it("is one suggestion: every record within the engine's grouping radius, 2.5 τ, of every other", () => {
    for (const a of RECORDS) {
      for (const b of RECORDS) {
        expect(distance(a, b)).toBeLessThanOrEqual(2.5 * TAU);
      }
    }
  });

  it("has one record per gazetteer, as the vote model above assumes", () => {
    expect(new Set(RECORDS.map((record) => record.id)).size).toBe(RECORDS.length);
  });
});

describe("the figures of the rules", () => {
  it.each(PANELS.filter((panel) => panel.key !== "citing").map((panel) => [panel.key, panel]))(
    "%s rings the record the engine picks",
    (key, panel) => {
      expect(panel.chosen).toBe(picks[key].id);
    },
  );

  it("cites, under the default rule, the gazetteers within half of τ of its pick", () => {
    const citing = PANELS.find((panel) => panel.key === "citing")!;
    expect(citing.chosen).toBe(picks["place-first"].id);
    const cited = RECORDS.filter((record) => distance(picks["place-first"], record) <= TAU / 2);
    expect(cited.map((record) => record.id).sort()).toEqual(["whg", "wikidata"]);
    expect(citing.text).toContain("wikidata and whg");
  });
});
