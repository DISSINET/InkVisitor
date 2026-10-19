import { describe, expect, it } from "vitest";
import {
  batchStarting,
  batchSummary,
  choicesFrom,
  nextUnsettled,
  tallyOf,
  withStep,
} from "./geocodingBatch";

const run = () =>
  batchStarting([
    { id: "a", label: "Roma" },
    { id: "b", label: "Odra" },
    { id: "c", label: "Pisa" },
  ]);

describe("batchStarting", () => {
  /**
   * The list has to be complete before the first request. A window that grew a
   * row at a time would move under the eye exactly while it was being read.
   */
  it("holds every target from the first frame, in the order they will be visited", () => {
    expect(run().steps.map((step) => step.label)).toEqual(["Roma", "Odra", "Pisa"]);
    expect(run().steps.every((step) => step.state === "waiting")).toBe(true);
    expect(run().done).toBe(false);
  });
});

describe("withStep", () => {
  it("moves one step and leaves the others alone", () => {
    const after = withStep(run(), "b", "written");
    expect(after?.steps.map((step) => step.state)).toEqual(["waiting", "written", "waiting"]);
  });

  it("carries the reason a step was skipped", () => {
    const after = withStep(run(), "a", "skipped", {
      note: "2 answers are within the engine's own margin",
    });
    expect(after?.steps[0].note).toContain("within the engine");
  });

  /** The run is cleared while an update is in flight; the update is not a crash. */
  it("passes an absent run through", () => {
    expect(withStep(null, "a", "written")).toBeNull();
  });
});

describe("batchSummary", () => {
  it("counts the Location in flight while the run is going", () => {
    expect(batchSummary(run())).toBe("geocoding 1 of 3");
    const after = withStep(run(), "a", "written") as ReturnType<typeof batchStarting>;
    expect(batchSummary(after)).toBe("geocoding 2 of 3");
  });

  /**
   * Never past the end. The last step is running while nothing has been decided
   * about it, and "geocoding 4 of 3" is what a naive count prints there.
   */
  it("does not count past the last one", () => {
    let after = run();
    for (const id of ["a", "b", "c"]) {
      after = withStep(after, id, "written") as typeof after;
    }
    expect(batchSummary({ ...after, done: false })).toBe("geocoding 3 of 3");
  });

  it("reports what was refused as well as what was written", () => {
    let after = withStep(run(), "a", "written") as ReturnType<typeof batchStarting>;
    after = withStep(after, "b", "skipped", { note: "off-region" }) as typeof after;
    after = withStep(after, "c", "written") as typeof after;
    expect(batchSummary({ ...after, done: true })).toBe("2 geocoded · 1 left for you");
  });

  /** A stopped run has a tail nobody asked about, and saying so is the point. */
  it("names the tail a stopped run never reached", () => {
    const after = withStep(run(), "a", "written") as ReturnType<typeof batchStarting>;
    expect(batchSummary({ ...after, done: true, stopped: true })).toBe(
      "1 geocoded · 2 not reached",
    );
  });
});

describe("tallyOf", () => {
  it("counts the step in flight as still to come", () => {
    const after = withStep(run(), "a", "running") as ReturnType<typeof batchStarting>;
    expect(tallyOf(after)).toEqual({ written: 0, skipped: 0, failed: 0, waiting: 3, total: 3 });
  });
});

describe("choicesFrom", () => {
  /**
   * The run refused to write an off-region answer unasked; offering the same
   * answer as the thing to click would make that refusal decorative.
   */
  it("drops the answers the run itself would not take", () => {
    const suggestions = [
      { label: "here", offRegion: false },
      { label: "far", offRegion: true },
      { label: "also here", offRegion: false },
    ] as unknown as Parameters<typeof choicesFrom>[0];
    expect(choicesFrom(suggestions).map((one) => one.label)).toEqual(["here", "also here"]);
  });
});

describe("nextUnsettled", () => {
  const mixed = () => {
    let after = batchStarting([
      { id: "a", label: "Roma" },
      { id: "b", label: "Odra" },
      { id: "c", label: "Pisa" },
      { id: "d", label: "Aura" },
    ]);
    after = withStep(after, "a", "written") as typeof after;
    after = withStep(after, "b", "skipped", { note: "tied" }) as typeof after;
    after = withStep(after, "c", "written") as typeof after;
    after = withStep(after, "d", "failed") as typeof after;
    return after;
  };

  it("skips over what the run already settled", () => {
    expect(nextUnsettled(mixed(), null)).toBe("b");
    expect(nextUnsettled(mixed(), "b")).toBe("d");
  });

  /**
   * Wrapping is what makes this one press per decision. Stopping at the end
   * would leave the last press doing nothing, on the screen where the reader is
   * least able to see why.
   */
  it("comes round again from the last one", () => {
    expect(nextUnsettled(mixed(), "d")).toBe("b");
  });

  it("reports nothing where a run left nothing behind", () => {
    const settled = withStep(
      withStep(batchStarting([{ id: "a", label: "Roma" }]), "a", "written"),
      "a",
      "written",
    );
    expect(nextUnsettled(settled!, null)).toBeNull();
  });
});
