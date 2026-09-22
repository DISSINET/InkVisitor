import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FOCUS_MARK_MS, MapFocus, nextFocus } from "./mapFocus";
import { render, Rendered } from "./renderForTest";
import { useFocusRing } from "./useFocusRing";

/**
 * The two things a reader asked for when they asked to see a point: one ring at
 * a time, and a ring that takes itself away.
 */

const Probe = ({ focus }: { focus: MapFocus | null }) => {
  const ringed = useFocusRing(focus);
  return <span data-ringed>{ringed ? ringed.at.join(",") : "none"}</span>;
};

let view: Rendered;
const ringOn = (focus: MapFocus | null) => {
  view.update(<Probe focus={focus} />);
  return view.one("[data-ringed]")?.textContent;
};
const after = (ms: number) => view.run(() => vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
  view = render(<Probe focus={null} />);
});
afterEach(() => {
  view.unmount();
  vi.useRealTimers();
});

describe("the ring on a point that was asked for", () => {
  it("shows nothing until something is asked for", () => {
    expect(view.one("[data-ringed]")?.textContent).toBe("none");
  });

  it("takes itself away once the reader has had time to find it", () => {
    const asked = nextFocus(null, 50.1645, 10.0074);
    expect(ringOn(asked)).toBe("50.1645,10.0074");
    after(FOCUS_MARK_MS - 1);
    expect(view.one("[data-ringed]")?.textContent).toBe("50.1645,10.0074");
    after(1);
    expect(view.one("[data-ringed]")?.textContent).toBe("none");
  });

  /**
   * The one that a timer per asking would get wrong: the first ring's timer
   * must die with the ring, or it fires mid-life over the second and clears a
   * ring the reader has only just asked for.
   */
  it("is replaced by the next asking, and outlives the first one's clock", () => {
    const first = nextFocus(null, 50.1645, 10.0074);
    ringOn(first);
    after(FOCUS_MARK_MS - 1000);
    const second = nextFocus(first, 43.7167, 10.3833);
    expect(ringOn(second)).toBe("43.7167,10.3833");
    after(1001);
    expect(view.one("[data-ringed]")?.textContent).toBe("43.7167,10.3833");
    after(FOCUS_MARK_MS);
    expect(view.one("[data-ringed]")?.textContent).toBe("none");
  });

  /**
   * Asking twice for the same place is a request to be shown it again, which a
   * coordinate cannot express on its own.
   */
  it("comes back for a second asking about the same point", () => {
    const first = nextFocus(null, 50.1645, 10.0074);
    ringOn(first);
    after(FOCUS_MARK_MS);
    expect(view.one("[data-ringed]")?.textContent).toBe("none");
    expect(ringOn(nextFocus(first, 50.1645, 10.0074))).toBe("50.1645,10.0074");
  });
});
