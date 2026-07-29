/**
 * Viewport unit tests.
 *
 * `startBuffer` is the mirror image of the trailing scroll buffer
 * (VIEWPORT_END_BUFFER_ROWS / scrollExtentLineCount in Annotator.ts): it lets
 * lineStart go a small distance below 0 so content pinned under a floating UI
 * bar at the very top of the canvas can still be scrolled clear. Every test
 * here uses a viewport 5 lines tall against a 20-line extent (noLines=5,
 * maxLines=20) so maxStart = 20 - 1 - 5 = 14, comfortably away from the upper
 * bound the buffer isn't concerned with.
 */
import Viewport from "./Viewport";

describe("Viewport startBuffer default", () => {
  test("defaults to 0 when omitted from the constructor", () => {
    const vp = new Viewport(0, 5);
    expect(vp.startBuffer).toBe(0);
  });

  test("scrollUp still clamps lineStart at 0 (existing behaviour untouched)", () => {
    const vp = new Viewport(0, 5);
    vp.scrollUp(3);
    expect(vp.lineStart).toBe(0);
  });

  test("scrollUp from a positive line clamps at 0, not below", () => {
    const vp = new Viewport(2, 5);
    vp.scrollUp(5);
    expect(vp.lineStart).toBe(0);
  });

  test("setScrollPosition clamps a below-range request at 0", () => {
    const vp = new Viewport(0, 5);
    vp.setScrollPosition(-10, 0, 20, 20);
    expect(vp.lineStart).toBe(0);
    expect(vp.scrollOffsetY).toBe(0);
  });
});

describe("scrollUp with a startBuffer", () => {
  test("reaches -1 and stops there", () => {
    const vp = new Viewport(0, 5, 1);
    vp.scrollUp(1);
    expect(vp.lineStart).toBe(-1);

    // Further attempts to scroll up must not go past -startBuffer.
    vp.scrollUp(5);
    expect(vp.lineStart).toBe(-1);
  });

  test("supports an arbitrary startBuffer, not just 1", () => {
    const vp = new Viewport(0, 5, 2);
    vp.scrollUp(10);
    expect(vp.lineStart).toBe(-2);
  });
});

describe("scrollDown from a buffered start", () => {
  test("returns from -1 to 0 and onward without any Viewport change needed", () => {
    const vp = new Viewport(-1, 5, 1);
    vp.scrollDown(1, 20);
    expect(vp.lineStart).toBe(0);

    vp.scrollDown(2, 20);
    expect(vp.lineStart).toBe(2);
  });
});

describe("addScrollOffset with a startBuffer", () => {
  test("a negative delta crosses from 0 to -1 and clamps there", () => {
    const vp = new Viewport(0, 5, 1);
    // -5px against a 20px line height crosses one line boundary upward.
    vp.addScrollOffset(-5, 20, 20);
    expect(vp.lineStart).toBe(-1);
    expect(vp.scrollOffsetY).toBe(15);
  });

  test("clamps at -1 regardless of how large the negative delta is", () => {
    const vp = new Viewport(0, 5, 1);
    vp.addScrollOffset(-1000, 20, 20);
    expect(vp.lineStart).toBe(-1);
    expect(vp.scrollOffsetY).toBe(0);
  });

  test("a positive delta moves lineStart from the buffer back into content", () => {
    const vp = new Viewport(-1, 5, 1);
    vp.addScrollOffset(25, 20, 20);
    expect(vp.lineStart).toBe(0);
    expect(vp.scrollOffsetY).toBe(5);
  });
});

describe("setScrollPosition with a startBuffer", () => {
  test("clamps a below-range request at -startBuffer", () => {
    const vp = new Viewport(0, 5, 1);
    vp.setScrollPosition(-10, 0, 20, 20);
    expect(vp.lineStart).toBe(-1);
    expect(vp.scrollOffsetY).toBe(0);
  });

  test("accepts exactly -startBuffer without further clamping", () => {
    const vp = new Viewport(0, 5, 1);
    vp.setScrollPosition(-1, 0, 20, 20);
    expect(vp.lineStart).toBe(-1);
  });
});

describe("scrollTo with a startBuffer", () => {
  test("scrollTo(-1, ...) lands on -1", () => {
    const vp = new Viewport(0, 5, 1);
    vp.scrollTo(-1, 20);
    expect(vp.lineStart).toBe(-1);
  });

  test("scrollTo back down from -1 reaches the requested line", () => {
    const vp = new Viewport(-1, 5, 1);
    vp.scrollTo(3, 20);
    expect(vp.lineStart).toBe(3);
  });
});
