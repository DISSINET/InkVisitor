/**
 * #2487 — annotator font settings (size + family), surfaced in the Options modal.
 * Font family + proportional layout are coupled; font size scales line height.
 */
import { Annotator } from "./lib/Annotator";

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  return new Annotator(c, text);
};

// Setters persist to localStorage; clear between tests so a fresh Annotator
// doesn't inherit a prior test's font settings via loadSettings.
beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("Annotator font size", () => {
  test("setFontSize updates the size, the font string, and scales line height", () => {
    const a = mk("abc");
    const baseLineHeight = a.lineHeight; // 13px default
    a.setFontSize(15);
    expect(a.fontSize).toBe(15);
    expect(a.font).toContain(`${15 * a.ratio}px`);
    expect(a.lineHeight).toBeCloseTo(baseLineHeight * (15 / 13));
  });

  test("font size persists across a proportional toggle (font string keeps the size)", () => {
    const a = mk("abc");
    a.setFontSize(15);
    a.setProportional(true, '"Roboto", sans-serif');
    expect(a.fontSize).toBe(15);
    expect(a.font).toContain(`${15 * a.ratio}px`);
    expect(a.font).toContain("Roboto");
  });
});

describe("Annotator font family", () => {
  test("setFontFamily switches the rendered family when proportional", () => {
    const a = mk("abc");
    a.setProportional(true, '"Roboto", sans-serif');
    a.setFontFamily("Georgia, serif");
    expect(a.proportionalFontFamily).toBe("Georgia, serif");
    expect(a.font).toContain("Georgia, serif");
  });

  test("setFontFamily while monospace stores the family but keeps the monospace font", () => {
    const a = mk("abc");
    a.setFontFamily("Georgia, serif");
    expect(a.proportionalFontFamily).toBe("Georgia, serif");
    expect(a.font).toContain("Roboto Mono"); // still monospace until proportional is on
    a.setProportional(true); // no explicit family -> uses the stored one
    expect(a.font).toContain("Georgia, serif");
  });
});

describe("Annotator line spacing", () => {
  test("setLineHeightRatio scales the line height off the font size", () => {
    const a = mk("abc");
    a.setLineHeightRatio(1.15);
    expect(a.lineHeightRatio).toBe(1.15);
    expect(a.lineHeight).toBeCloseTo(a.fontSize * 1.15 * a.ratio);
  });

  test("ratios below 1 clamp to 1 (lines never overlap)", () => {
    const a = mk("abc");
    a.setLineHeightRatio(0.5);
    expect(a.lineHeightRatio).toBe(1);
  });

  test("line spacing and font size compose", () => {
    const a = mk("abc");
    a.setLineHeightRatio(2);
    a.setFontSize(15);
    expect(a.lineHeight).toBeCloseTo(15 * 2 * a.ratio);
  });

  test("persists and restores across construction", () => {
    const a = mk("abc");
    a.setLineHeightRatio(1.4);
    const b = mk("abc");
    expect(b.lineHeightRatio).toBe(1.4);
    expect(b.lineHeight).toBeCloseTo(b.fontSize * 1.4 * b.ratio);
  });

  test("resetSettings restores the default spacing", () => {
    const a = mk("abc");
    const defaultLineHeight = a.lineHeight;
    a.setLineHeightRatio(1.15);
    a.resetSettings();
    expect(a.lineHeight).toBeCloseTo(defaultLineHeight);
  });
});

describe("font family options", () => {
  test("setFontFamilyOptions defaults the family to the first option when untouched", () => {
    const a = mk("abc");
    a.setFontFamilyOptions([
      { label: "Roboto", value: '"Roboto", sans-serif' },
      { label: "Serif", value: "Georgia, serif" },
    ]);
    expect(a.proportionalFontFamily).toBe('"Roboto", sans-serif');
  });

  test("setFontFamilyOptions does not override an already-chosen family", () => {
    const a = mk("abc");
    a.setFontFamily("Georgia, serif");
    a.setFontFamilyOptions([
      { label: "Roboto", value: '"Roboto", sans-serif' },
      { label: "Serif", value: "Georgia, serif" },
    ]);
    expect(a.proportionalFontFamily).toBe("Georgia, serif");
  });

  test("setFontFamilyOptions rebuilds the rendered font when proportional is already on", () => {
    const a = mk("abc");
    a.setProportional(true); // family still the generic fallback
    expect(a.font).toContain("sans-serif");
    a.setFontFamilyOptions([{ label: "Roboto", value: '"Roboto", sans-serif' }]);
    expect(a.proportionalFontFamily).toBe('"Roboto", sans-serif');
    // font (and the measurer) must actually rebuild, not just the field
    expect(a.font).toContain('"Roboto", sans-serif');
  });
});

describe("font settings persistence", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  test("setters persist proportional/family/size", () => {
    const a = mk("abc");
    a.setFontSize(15);
    a.setProportional(true, '"Roboto", sans-serif');
    a.setFontFamily("Georgia, serif");
    const stored = JSON.parse(
      localStorage.getItem("inkvisitor.annotator.settings") as string,
    );
    expect(stored.proportional).toBe(true);
    expect(stored.fontFamily).toBe("Georgia, serif");
    expect(stored.fontSize).toBe(15);
  });

  test("loadSettings restores font settings on construction (proportional layout active)", () => {
    localStorage.setItem(
      "inkvisitor.annotator.settings",
      JSON.stringify({
        proportional: true,
        fontFamily: "Georgia, serif",
        fontSize: 15,
      }),
    );
    const a = mk("abc");
    expect(a.proportional).toBe(true);
    expect(a.fontSize).toBe(15);
    expect(a.proportionalFontFamily).toBe("Georgia, serif");
    expect(a.font).toContain("Georgia, serif");
    expect(a.font).toContain(`${15 * a.ratio}px`);
    // prefix tables built => proportional layout is actually engaged on load
    expect(a.text.segments[0].linePrefixes.length).toBeGreaterThan(0);
  });

  test("resetSettings returns font to monospace defaults", () => {
    const a = mk("abc");
    a.setProportional(true, "Georgia, serif");
    a.setFontSize(15);
    a.resetSettings();
    expect(a.proportional).toBe(false);
    expect(a.fontSize).toBe(13);
    expect(a.font).toContain("Roboto Mono");
    expect(a.text.segments[0].linePrefixes).toEqual([]);
  });
});
