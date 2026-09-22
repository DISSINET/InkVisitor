import { GeocodingAccuracy } from "@inkvisitor/shared/types/geocoding";
import { describe, expect, it } from "vitest";
import { SuggestResponse, Suggestion } from "./engineTypes";
import { isTaken, namesOfTied, quickPick, tooCloseToCall } from "./quickGeocode";

/** One match, so its spread is unmeasured and the accuracy comes out precise. */
const at = (score: number, matchCount = 1): Suggestion =>
  ({ score, spreadKm: 0, matches: Array.from({ length: matchCount }, () => ({})) }) as Suggestion;

const run = (scores: number[], margin: number | null = 0.5): SuggestResponse =>
  ({ suggestions: scores.map((score) => at(score)), margin }) as SuggestResponse;

describe("quickPick", () => {
  it("takes nothing from a run that found nothing", () => {
    expect(quickPick(null, { strategy: "topScore" })).toEqual({ skip: "no gazetteer offered a place" });
    expect(quickPick(run([]), { strategy: "topScore" })).toEqual({ skip: "no gazetteer offered a place" });
  });

  it("takes the strongest under 'whichever scores highest', however close the second", () => {
    const pick = quickPick(run([0.51, 0.5]), { strategy: "topScore" });
    expect(isTaken(pick) && pick.index).toBe(0);
  });

  /**
   * The rule the strict strategy exists for. Two answers the engine could not
   * separate are exactly the case a person has to look at, and taking the first
   * of them writes a coin toss into the corpus.
   */
  it("refuses a crowd under 'clear winner only', and says which answers they are", () => {
    const pick = quickPick(run([0.51, 0.5]), { strategy: "clearWinner" });
    expect(isTaken(pick)).toBe(false);
    expect((pick as { skip: string }).skip).toContain("too close to call");
  });

  it("takes a leader that is ahead by more than the engine's margin", () => {
    // 0.2 is the margin the engine's own auto-accept sketch uses; 0.5 is well
    // outside 80% of 0.9
    const pick = quickPick(run([0.9, 0.5]), { strategy: "clearWinner" });
    expect(isTaken(pick) && pick.index).toBe(0);
  });

  /**
   * A margin needs two scores to be a margin, so the engine reports none for a
   * run of one — and a single answer has nothing to be confused with, which is
   * what "clear" means.
   */
  it("takes a lone answer under either strategy", () => {
    expect(isTaken(quickPick(run([0.4], null), { strategy: "clearWinner" }))).toBe(true);
    expect(isTaken(quickPick(run([0.4], null), { strategy: "topScore" }))).toBe(true);
  });

  it("refuses a run of several whose margin the engine did not report", () => {
    expect(quickPick(run([0.9, 0.5], null), { strategy: "clearWinner" })).toEqual({
      skip: "the engine reported no margin, so nothing here is a clear winner",
    });
  });

  /**
   * The accuracy is read off the evidence rather than chosen: matches sitting
   * far apart are a group held together by the merge radius, and calling that
   * precise would record a claim the sources do not make.
   */
  it("writes the accuracy the sources argue for, not a fixed one", () => {
    const tight = { suggestions: [at(0.9, 3)], mergeRadiusKm: 25 } as SuggestResponse;
    const scattered = {
      suggestions: [{ ...at(0.9, 3), spreadKm: 20 } as Suggestion],
      mergeRadiusKm: 25,
    } as SuggestResponse;
    const one = quickPick(tight, { strategy: "topScore" });
    const two = quickPick(scattered, { strategy: "topScore" });
    expect(isTaken(one) && one.accuracy).toBe(GeocodingAccuracy.Precise);
    expect(isTaken(two) && two.accuracy).toBe(GeocodingAccuracy.Approximate);
  });
});

describe("quickPick and an answer outside the region", () => {
  const away = (): SuggestResponse =>
    ({
      suggestions: [{ ...at(0.9), offRegion: true } as Suggestion, at(0.2)],
      margin: 0.5,
    }) as SuggestResponse;

  /**
   * The one refusal that survives a clear lead. A score says how well the
   * sources agree about a name; it says nothing about whether the place they
   * agree on is one this corpus can contain, and the engine has already said it
   * is not.
   */
  it("refuses an off-region answer however far ahead it is, under either strategy", () => {
    const reason = "the best answer is outside the region the query asked about";
    expect(quickPick(away(), { strategy: "clearWinner" })).toEqual({ skip: reason });
    expect(quickPick(away(), { strategy: "topScore" })).toEqual({ skip: reason });
  });

  it("takes it where the corpus says off-region answers count", () => {
    const pick = quickPick(away(), { strategy: "clearWinner", takeOffRegion: true });
    expect(isTaken(pick) && pick.index).toBe(0);
  });

  /**
   * Refused for being outside the region, not for being second. Reporting the
   * crowd instead would send a researcher looking for a tie that is not the
   * reason nothing was written.
   */
  it("says which of the two refusals applied", () => {
    const crowdedAndAway = {
      suggestions: [{ ...at(0.51), offRegion: true } as Suggestion, at(0.5)],
      margin: 0.02,
    } as SuggestResponse;
    expect(quickPick(crowdedAndAway, { strategy: "clearWinner" })).toEqual({
      skip: "the best answer is outside the region the query asked about",
    });
  });
});

/**
 * A refusal is read away from the answers it is about — in a toast, or in a
 * batch report a hundred rows long. These would fail if it went back to a bare
 * count: "2 answers are within the engine's own margin" is true and leaves the
 * researcher to go and find out which two.
 */
describe("saying which answers were too close to call", () => {
  // scatterOf reads the matches behind a suggestion, so a label alone is not a
  // suggestion the decision can be run against
  const at = (label: string, score = 0.5) =>
    ({ label, score, lat: 0, lon: 0, spreadKm: 0, matches: [{}] }) as unknown as Suggestion;

  it("names them where the names already differ", () => {
    // the measured case: two medieval German Frankfurts, and naming them is the
    // whole explanation
    expect(
      tooCloseToCall(
        [
          at("Frankfurt am Main (Hesse, Germany, ... World)"),
          at("Frankfurt an der Oder (Brandenburg, Germany, ... World)"),
        ],
        2,
      ),
    ).toBe("Frankfurt am Main and Frankfurt an der Oder are too close to call");
  });

  /**
   * Four suggestions for `Breslau` are four identical words until the
   * administrative path is put back, so a message built from names alone would
   * read "Breslau and Breslau are too close to call".
   */
  it("puts the region back where the names collide", () => {
    expect(
      namesOfTied([
        at("Breslau (Pierce, Nebraska, ... World)"),
        at("Breslau (Lavaca, Texas, ... World)"),
      ]),
    ).toEqual(["Breslau (Pierce, Nebraska)", "Breslau (Lavaca, Texas)"]);
  });

  it("leaves a name alone when nothing else shares it", () => {
    expect(namesOfTied([at("Wroc\u0142aw"), at("Ole\u015bnica (Wroc\u0142aw)")])).toEqual([
      "Wroc\u0142aw",
      "Ole\u015bnica",
    ]);
  });

  it("keeps a name that carries no region at all", () => {
    // not every source writes the brackets, which is a fact about the record
    expect(namesOfTied([at("Roman Catholic Diocese of G\u00f6rlitz")])).toEqual([
      "Roman Catholic Diocese of G\u00f6rlitz",
    ]);
  });

  it("counts the rest once a list stops being a sentence", () => {
    const many = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"].map((n) => at(n));
    expect(tooCloseToCall(many, 5)).toBe(
      "5 answers are too close to call: Alpha, Beta, Gamma, and 2 more",
    );
  });

  it("reaches the refusal through the decision itself", () => {
    const response = {
      margin: 0.05,
      mergeRadiusKm: 25,
      suggestions: [
        at("Frankfurt am Main (Hesse, Germany, ... World)", 0.62),
        at("Frankfurt an der Oder (Brandenburg, Germany, ... World)", 0.59),
      ],
    } as unknown as SuggestResponse;
    const pick = quickPick(response, { strategy: "clearWinner" });
    expect(isTaken(pick)).toBe(false);
    expect((pick as { skip: string }).skip).toContain("Frankfurt an der Oder");
  });
});
