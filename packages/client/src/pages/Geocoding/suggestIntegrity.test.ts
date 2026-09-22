import { describe, expect, it } from "vitest";
import { SuggestResponse } from "./engineTypes";
import { degradationsOf } from "./suggestIntegrity";

/**
 * The engine answers 200 whether or not its language-model stages ran, so every
 * signal that they did not is a field rather than a status code.
 */
const response = (over: Partial<SuggestResponse> = {}): SuggestResponse =>
  ({
    suggestions: [],
    sources: [],
    query: { name: "Kanth", region: "silesia", candidates: [{ llmProvider: "groq" }] },
    contextEvaluated: true,
    elapsed_ms: 5000,
    ...over,
  }) as unknown as SuggestResponse;

describe("degradationsOf", () => {
  it("says nothing about a request where every stage ran", () => {
    expect(degradationsOf(response())).toEqual([]);
  });

  it("catches the fallback to the bare name, which returns 200 and looks fine", () => {
    const notes = degradationsOf(
      response({ query: { name: "Kanth", candidates: [{ llmProvider: "none" }] } as never }),
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain("name as written");
  });

  it("catches criteria that were sent and never weighed", () => {
    expect(degradationsOf(response({ contextEvaluated: false }))[0]).toContain("not weighed");
  });

  it("stays quiet about the context stage when no criteria were sent to weigh", () => {
    expect(
      degradationsOf(
        response({
          contextEvaluated: false,
          query: { name: "Kanth", candidates: [{ llmProvider: "groq" }] } as never,
        }),
      ),
    ).toEqual([]);
  });

  it("stays quiet on a preview frame, which has not reached that stage", () => {
    // absent is not the same as false, and the preview omits the field entirely
    expect(degradationsOf(response({ contextEvaluated: undefined }))).toEqual([]);
  });

  it("names the sources that failed, answered in part, or were benched", () => {
    const notes = degradationsOf(
      response({
        sources: [
          { name: "gov", status: "ran", count: 3, ms: 10 },
          { name: "tgn", status: "failed", count: 0, ms: 0 },
          { name: "geonames", status: "ran", count: 5, ms: 90, partial: true },
          { name: "whg", status: "unavailable", count: 0, ms: 0, benched: true },
        ],
      }),
    );
    expect(notes[0]).toContain("3 sources");
    expect(notes[0]).toContain("tgn, geonames, whg");
    expect(notes[0]).not.toContain("gov");
  });

  it("reports every stage that fell over, not only the first", () => {
    const notes = degradationsOf(
      response({
        query: { name: "Kanth", region: "silesia", candidates: [{ llmProvider: "none" }] } as never,
        contextEvaluated: false,
        sources: [{ name: "tgn", status: "failed", count: 0, ms: 0 }],
      }),
    );
    expect(notes).toHaveLength(3);
  });
});
