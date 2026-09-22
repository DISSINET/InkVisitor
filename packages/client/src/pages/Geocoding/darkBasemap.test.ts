import { describe, expect, it } from "vitest";
import libertyLayers from "./__fixtures__/libertyLayers.json";
import { colourKeysFor, darkened, darkenPaintValue, parseColor } from "./darkBasemap";

describe("parseColor", () => {
  it("reads the three forms the served style actually uses", () => {
    expect(parseColor("#ffffff")).toMatchObject({ l: 1, s: 0 });
    expect(parseColor("rgb(0, 0, 0)")).toMatchObject({ l: 0 });
    expect(parseColor("hsl(120, 50%, 40%)")).toMatchObject({ h: 120, s: 0.5, l: 0.4 });
  });

  it("reads short hex as the same colour as its long form", () => {
    expect(parseColor("#abc")).toEqual(parseColor("#aabbcc"));
  });

  it("keeps alpha, from either an eight-digit hex or an rgba", () => {
    expect(parseColor("#ff000080")?.a).toBeCloseTo(0.502, 2);
    expect(parseColor("rgba(255, 0, 0, 0.25)")?.a).toBe(0.25);
  });

  /**
   * A colour this cannot read must be left exactly as the style wrote it. Drawn
   * in the wrong theme it is merely out of place; substituted, it is wrong.
   */
  it("reports nothing for a form it does not know", () => {
    for (const value of ["rebeccapurple", "currentColor", "#12", "", "url(#grad)"]) {
      expect(parseColor(value), value).toBeNull();
    }
  });
});

describe("darkened", () => {
  it("turns a near-white ground into a near-black one, and back", () => {
    expect(parseColor(darkened("#ffffff") as string)?.l).toBe(0);
    expect(parseColor(darkened("#000000") as string)?.l).toBe(1);
  });

  /**
   * The property that makes the recoloured map still readable as a map:
   * woodland stays green and water stays blue, so a reader who knows the light
   * map can read the dark one without learning it again.
   */
  it("keeps the hue, so green stays green and blue stays blue", () => {
    for (const value of ["#2a7f3e", "hsl(210, 60%, 70%)", "rgb(20, 90, 200)"]) {
      const before = parseColor(value);
      const after = parseColor(darkened(value) as string);
      expect(Math.round(after?.h ?? -1), value).toBe(Math.round(before?.h ?? -2));
    }
  });

  it("pulls saturation in, because a hue gentle on white is loud on black", () => {
    const before = parseColor("hsl(120, 100%, 90%)");
    const after = parseColor(darkened("hsl(120, 100%, 90%)") as string);
    expect((after?.s ?? 1)).toBeLessThan(before?.s ?? 0);
  });

  it("carries alpha through, so a translucent fill stays translucent", () => {
    expect(darkened("rgba(0, 0, 0, 0.4)")).toContain("hsla(");
    expect(parseColor(darkened("rgba(0, 0, 0, 0.4)") as string)?.a).toBe(0.4);
  });

  it("returns nothing for a value it cannot read", () => {
    expect(darkened("rebeccapurple")).toBeNull();
  });
});

describe("colourKeysFor", () => {
  /**
   * The crash this exists to prevent. The renderer looks a paint property up in
   * the set its layer type declares and reads the result without checking it,
   * so asking a line layer for `fill-color` throws rather than returning
   * nothing — and a recolour that walks the whole style asks about every layer.
   */
  it("offers a layer type only the properties that type can hold", () => {
    expect(colourKeysFor("line")).not.toContain("fill-color");
    expect(colourKeysFor("fill")).not.toContain("line-color");
    expect(colourKeysFor("symbol")).not.toContain("circle-color");
    expect(colourKeysFor("background")).toEqual(["background-color"]);
  });

  it("offers nothing for a type that carries an image rather than a colour", () => {
    expect(colourKeysFor("raster")).toEqual([]);
  });

  it("offers nothing for a type it has never heard of", () => {
    expect(colourKeysFor("sky")).toEqual([]);
  });

  it("knows every layer type the real style contains", () => {
    const layers = libertyLayers as { type: string; paint?: Record<string, unknown> }[];
    for (const layer of layers) {
      const painted = Object.keys(layer.paint ?? {}).filter((key) => key.endsWith("-color"));
      for (const key of painted) {
        expect(colourKeysFor(layer.type), `${layer.type} / ${key}`).toContain(key);
      }
    }
  });
});

describe("darkenPaintValue", () => {
  it("recolours a plain colour", () => {
    expect(darkenPaintValue("#ffffff")).toBe(darkened("#ffffff"));
  });

  /**
   * Paint properties are often zoom ramps. Only the leaves that read as colours
   * may change — the operators, the stops and the shape of the expression are
   * the style's own and mean nothing to a theme.
   */
  it("recolours inside an expression without disturbing its structure", () => {
    const ramp = ["interpolate", ["linear"], ["zoom"], 5, "#e0e0e0", 12, "#ffffff"];
    const out = darkenPaintValue(ramp) as unknown[];
    expect(out[0]).toBe("interpolate");
    expect(out[1]).toEqual(["linear"]);
    expect(out[2]).toEqual(["zoom"]);
    expect(out[3]).toBe(5);
    expect(out[5]).toBe(12);
    expect(out[4]).toBe(darkened("#e0e0e0"));
    expect(out[6]).toBe(darkened("#ffffff"));
  });

  it("leaves a value that holds no colour completely alone", () => {
    expect(darkenPaintValue(["get", "class"])).toEqual(["get", "class"]);
    expect(darkenPaintValue(2)).toBe(2);
    expect(darkenPaintValue(undefined)).toBeUndefined();
  });

  /**
   * Read against the served style rather than an invented one: every colour it
   * carries must come back as a colour, or the map is drawn with holes in it.
   */
  it("returns a readable colour for every plain colour the real style uses", () => {
    const layers = libertyLayers as { type: string; paint?: Record<string, unknown> }[];
    let seen = 0;
    for (const layer of layers) {
      for (const key of colourKeysFor(layer.type)) {
        const value = layer.paint?.[key];
        if (typeof value !== "string") {
          continue;
        }
        seen += 1;
        expect(parseColor(value), `${key}: ${value}`).not.toBeNull();
        expect(darkenPaintValue(value), `${key}: ${value}`).not.toBe(value);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});
