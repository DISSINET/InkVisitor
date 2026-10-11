import { describe, expect, it } from "vitest";
import { LEAD_IS_CLEAR, SUGGESTION_MARK, bandOf, flightFor, scoreShare, showsScore } from "./suggestionRank";

/**
 * Every suggestion is drawn as the same mark, because the number inside it is
 * the identification and it is exact where a size ramp is approximate.
 */
describe("SUGGESTION_MARK", () => {
  it("is one mark, findable at a glance", () => {
    expect(SUGGESTION_MARK.radius).toBeGreaterThanOrEqual(8);
    expect(SUGGESTION_MARK.fillOpacity).toBeGreaterThan(0.5);
    expect(SUGGESTION_MARK.opacity).toBe(1);
  });
});

/**
 * The map moves to the leader when a run finishes, and must not move again for
 * any other reason. A leader is a pair of numbers rebuilt on every render, so
 * what decides is whether the coordinate changed rather than whether the value
 * did — otherwise the map is taken back from a researcher who panned away every
 * time anything on the page re-rendered.
 */
describe("flightFor", () => {
  const wroclaw: [number, number] = [51.1079, 17.0384];

  it("flies to a leader when none has been flown to", () => {
    expect(flightFor(null, wroclaw)).toEqual({ key: "51.1079,17.0384", fly: true });
  });

  it("does not fly again for an equal coordinate rebuilt as a new value", () => {
    const { key } = flightFor(null, wroclaw);
    // a fresh array with the same numbers, which is what every render produces
    expect(flightFor(key, [51.1079, 17.0384]).fly).toBe(false);
  });

  it("flies when the rating puts a different suggestion first", () => {
    const { key } = flightFor(null, wroclaw);
    expect(flightFor(key, [50.0755, 14.4378]).fly).toBe(true);
  });

  it("does not fly when there is no leader, and forgets the one flown to", () => {
    const { key } = flightFor(null, wroclaw);
    const cleared = flightFor(key, null);
    expect(cleared).toEqual({ key: null, fly: false });
    // so selecting another place and getting the same leader back flies again
    expect(flightFor(cleared.key, wroclaw).fly).toBe(true);
  });

  it("tells a coordinate from one that only looks like it", () => {
    const { key } = flightFor(null, [51, 17]);
    expect(flightFor(key, [51.0001, 17]).fly).toBe(true);
  });
});

/**
 * How many suggestions the engine left tied with its leader. A tie is not a
 * near-miss: three suggestions for one query came back on identical scores and
 * identical on every other published field, so drawing them at different lengths
 * would order places the engine did not order.
 */
describe("bandOf", () => {
  const response = (...scores: number[]) => ({
    margin: scores.length > 1 ? (scores[0] - scores[1]) / scores[0] : null,
    suggestions: scores.map((score) => ({ score })),
  });

  it("calls a decisive leader a band of one", () => {
    const band = bandOf(response(0.74, 0.16, 0.13));
    expect(band).toEqual({ size: 1, clear: true });
  });

  it("counts every card the engine did not separate, not just the second", () => {
    // four within the threshold of the top, which is the case a badge on the
    // first card describes as "narrow lead" and undercounts
    expect(bandOf(response(0.52, 0.52, 0.5, 0.49, 0.2))?.size).toBe(4);
  });

  it("counts an exact tie as tied", () => {
    expect(bandOf(response(0.4593, 0.4593, 0.4593, 0.1))).toEqual({ size: 3, clear: false });
  });

  it("measures every card against the top rather than against its neighbour", () => {
    // chained, this long shallow tail would link end to end and swallow the list
    const tail = Array.from({ length: 40 }, (_, i) => 1 - i * 0.05);
    expect(bandOf(response(...tail))?.size).toBe(5);
  });

  it("takes the threshold from the same constant the page states", () => {
    const justInside = 1 - LEAD_IS_CLEAR;
    expect(bandOf(response(1, justInside))?.size).toBe(2);
    expect(bandOf(response(1, justInside - 0.001))?.size).toBe(1);
  });

  it("says nothing where the engine measured no margin", () => {
    // the preview frame carries none, and a band claimed there is a claim
    expect(bandOf({ margin: null, suggestions: [{ score: 1 }, { score: 1 }] })).toBeNull();
  });

  it("says nothing about a single suggestion, or about none", () => {
    expect(bandOf(response(0.5))).toBeNull();
    expect(bandOf(null)).toBeNull();
  });

  it("says nothing when every score is zero, rather than dividing by it", () => {
    expect(bandOf({ margin: 0, suggestions: [{ score: 0 }, { score: 0 }] })).toBeNull();
  });
});

/**
 * Six numbers over a map are readable while the places are far apart and become
 * one smudge when they are not. Which of them survives is decided by rank,
 * because rank is the only thing the number says.
 */
describe("showsScore", () => {
  it("prints a score where one suggestion leads", () => {
    expect(showsScore({ size: 1, clear: true }, 0)).toBe(true);
    expect(showsScore({ size: 1, clear: true }, 4)).toBe(true);
  });

  it("prints none for a card the engine did not separate from the leader", () => {
    const band = { size: 4, clear: false };
    expect(showsScore(band, 0)).toBe(false);
    expect(showsScore(band, 3)).toBe(false);
  });

  it("prints one again below the band, where an order exists", () => {
    expect(showsScore({ size: 4, clear: false }, 4)).toBe(true);
  });

  it("prints a score where there is no band to speak of", () => {
    // the preview frame carries no margin, so no band is computed from it
    expect(showsScore(null, 0)).toBe(true);
  });
});

/**
 * The ramp is measured against the run's own leader, because that is the only
 * comparison the engine's score supports.
 *
 * These would fail if the ramp went back to a fixed scale — which is the bug
 * the context weights made visible: the same correct answer measured 0.7571
 * under the default weights and 0.5979 with region weighted double, and on a
 * fixed scale that is the right answer going pale because a slider moved.
 */
describe("scoreShare", () => {
  it("paints the run's best answer at full strength", () => {
    expect(scoreShare(0.79, 0.79)).toBe(1);
    expect(scoreShare(0.3, 0.3)).toBe(1);
  });

  it("does not move the leader when the whole run's scores move together", () => {
    // one measured Breslau query, the same right answer under two weightings
    expect(scoreShare(0.7571, 0.7571)).toBe(scoreShare(0.5979, 0.5979));
  });

  it("places a runner-up by how far it trails, which is the engine's own unit", () => {
    // `margin` is (top − second) / top, so a runner-up's share is 1 − margin
    const top = 0.6427;
    const second = 0.504;
    const margin = (top - second) / top;
    expect(scoreShare(second, top)).toBeCloseTo(1 - margin, 6);
  });

  it("puts the long tail near the bottom", () => {
    expect(scoreShare(0.1018, 0.7571)).toBeCloseTo(0.13, 2);
  });

  it("clamps, and says nothing about a run with no score to compare against", () => {
    expect(scoreShare(0.5, 0)).toBe(0);
    expect(scoreShare(-5, 0.8)).toBe(0);
    expect(scoreShare(2, 0.8)).toBe(1);
  });
});
