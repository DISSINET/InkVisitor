import { describe, it, expect, vi } from "vitest";
import {
  setAnnotatorInstance,
  scrollToAnchor,
  highlightAnchorByTag,
  clearHoverHighlight,
} from "./useAnnotator";

describe("useAnnotator singleton", () => {
  it("delegates to the registered instance", () => {
    const inst = {
      scrollToAnchor: vi.fn(),
      highlightAnchorByTag: vi.fn(),
      clearHoverHighlight: vi.fn(),
    };
    setAnnotatorInstance(inst);

    scrollToAnchor("a", 2);
    highlightAnchorByTag("tag");
    clearHoverHighlight();

    expect(inst.scrollToAnchor).toHaveBeenCalledWith("a", 2);
    expect(inst.highlightAnchorByTag).toHaveBeenCalledWith("tag");
    expect(inst.clearHoverHighlight).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when no instance is registered", () => {
    setAnnotatorInstance(null);
    expect(() => {
      scrollToAnchor("a");
      highlightAnchorByTag("t");
      clearHoverHighlight();
    }).not.toThrow();
  });
});
