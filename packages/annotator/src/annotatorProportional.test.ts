/**
 * Phase 5 (proportional text) — P5.0 flag wiring on the Annotator.
 *
 * The `proportional` flag (default off) installs a CanvasMeasurer on the Text so
 * prefix-width tables are built; turning it off returns to the monospace grid.
 * jsdom's mocked `measureText` returns width 100 for any string, so the exact
 * pixel values here reflect that mock, not a real font.
 */
import { Annotator } from "./lib/Annotator";

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  return new Annotator(c, text);
};

describe("Annotator proportional flag", () => {
  test("defaults to monospace: no prefix tables built", () => {
    const a = mk("abc");
    expect(a.proportional).toBe(false);
    expect(a.text.segments[0].linePrefixes).toEqual([]);
  });

  test("setProportional(true) installs a canvas measurer and builds prefixes", () => {
    const a = mk("abc");
    a.setProportional(true);
    expect(a.proportional).toBe(true);
    expect(a.text.columnToPixelX(0, 1)).toBe(100); // mocked measureText width
    expect(a.text.pixelWidthOfLine(0)).toBe(300); // "abc" -> 3 * 100
  });

  test("setProportional(false) returns to the monospace grid", () => {
    const a = mk("abc");
    a.setProportional(true);
    a.setProportional(false);
    expect(a.proportional).toBe(false);
    expect(a.text.segments[0].linePrefixes).toEqual([]);
  });

  test("setProportional(true) sets the pixel wrap budget from the viewport width", () => {
    const a = mk("abc");
    a.setProportional(true);
    expect(a.text.maxPixelWidth).toBe(a.width);
  });

  test("setProportional(true, family) switches the rendered font to that family", () => {
    const a = mk("abc");
    a.setProportional(true, "Inter, sans-serif");
    expect(a.font).toContain("Inter, sans-serif");
    expect(a.font).not.toContain("Roboto Mono");
  });

  test("setProportional(true) without a family falls back to a proportional font", () => {
    const a = mk("abc");
    a.setProportional(true);
    expect(a.font).toContain("sans-serif");
    expect(a.font).not.toContain("Roboto Mono");
  });

  test("setProportional(false) restores the monospace font", () => {
    const a = mk("abc");
    a.setProportional(true, "Inter");
    a.setProportional(false);
    expect(a.font).toContain("Roboto Mono");
  });
});
