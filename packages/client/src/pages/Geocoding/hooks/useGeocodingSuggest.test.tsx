import { IGeocodingContext } from "@inkvisitor/shared/types/geocoding";
import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../utils/test/renderForTest";
import type { EngineProgress } from "../utils/engine/engine";
import { UseGeocodingSuggest, useGeocodingSuggest } from "./useGeocodingSuggest";

const engine = vi.hoisted(() => ({
  engineSuggestStream: vi.fn(),
  watchEngineProgress: vi.fn(),
}));

// the engine is the boundary: what is asserted is what the page's own hook does
// while an answer is awaited, so the request is one that never returns
vi.mock("../utils/engine/engine", () => engine);

let renders = 0;
let suggest: UseGeocodingSuggest;
const Probe = () => {
  renders += 1;
  suggest = useGeocodingSuggest();
  return null;
};

const context = {} as IGeocodingContext;

describe("useGeocodingSuggest while a request is running", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T12:00:00Z"));
    renders = 0;
    // calls from an earlier test belong to a component that is gone
    engine.engineSuggestStream.mockReset();
    engine.watchEngineProgress.mockReset();
    engine.engineSuggestStream.mockReturnValue(new Promise(() => {}));
    engine.watchEngineProgress.mockReturnValue(() => {});
  });
  afterEach(() => vi.useRealTimers());

  it("does not re-render its owner on a clock, because the owner is the whole page", () => {
    const view = render(<Probe />);
    act(() => {
      void suggest.run("loc-1", "Roma", context);
    });
    const afterStart = renders;

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(renders).toBe(afterStart);
    view.unmount();
  });

  it("says when the request started, and that nothing is running once it is cancelled", () => {
    const view = render(<Probe />);
    expect(suggest.startedAt).toBeNull();

    act(() => {
      void suggest.run("loc-1", "Roma", context);
    });
    expect(suggest.isRunning).toBe(true);
    expect(suggest.startedAt).toBe(Date.now());

    act(() => {
      suggest.cancel();
    });
    expect(suggest.isRunning).toBe(false);
    expect(suggest.startedAt).toBeNull();
    view.unmount();
  });

  it("does not re-render for a progress frame that repeats the last one", () => {
    let frame: ((progress: EngineProgress) => void) | undefined;
    engine.watchEngineProgress.mockImplementation((_id: string, onFrame: typeof frame) => {
      frame = onFrame;
      return () => {};
    });
    const progress = (answered: Record<string, number>): EngineProgress =>
      ({
        stage: "suggest",
        answered,
        failed: {},
        excluded: {},
        candidates: [{ name: "Roma", description: "", nameFit: 1, attestation: 1 }],
      }) as unknown as EngineProgress;

    const view = render(<Probe />);
    act(() => {
      void suggest.run("loc-1", "Roma", context);
    });
    // the request's opening frame is what starts the watch on the progress stream
    act(() => {
      engine.engineSuggestStream.mock.calls[0][2]("req-1");
    });
    act(() => frame!(progress({ wikidata: 3 })));
    const afterFirst = renders;

    // the engine sends its whole audit again each second, unchanged
    act(() => frame!(progress({ wikidata: 3 })));
    act(() => frame!(progress({ wikidata: 3 })));
    expect(renders).toBe(afterFirst);

    act(() => frame!(progress({ wikidata: 3, geonames: 5 })));
    expect(renders).toBe(afterFirst + 1);
    expect(suggest.sources.answered).toEqual({ wikidata: 3, geonames: 5 });
    view.unmount();
  });
});
