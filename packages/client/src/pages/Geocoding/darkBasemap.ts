/**
 * Turning the basemap dark without changing which map it is.
 *
 * The obvious alternative — pointing at the style server's own dark style — is
 * what this replaces. That style is a different, far sparser map: it carries no
 * parks and no points of interest at all, so a dark theme lost the green of a
 * town's open ground and the "built-up detail" switch had almost nothing left to
 * switch. One style recoloured keeps every layer, so both themes draw the same
 * map and every control means the same thing in each.
 *
 * The transform is lightness inversion in HSL: a near-white ground becomes a
 * near-black one, dark type becomes light type, and a hue is kept as the hue it
 * was — so woodland stays green and water stays blue, which is what makes the
 * map still readable as a map. Saturation is pulled in slightly, because a hue
 * that reads as gentle against white is loud against black.
 */

export interface Hsl {
  h: number;
  s: number;
  l: number;
  a: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const rgbToHsl = (r: number, g: number, b: number, a: number): Hsl => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  const span = max - min;
  if (span === 0) {
    return { h: 0, s: 0, l, a };
  }
  const s = l > 0.5 ? span / (2 - max - min) : span / (max + min);
  let h: number;
  if (max === red) {
    h = ((green - blue) / span + (green < blue ? 6 : 0)) / 6;
  } else if (max === green) {
    h = ((blue - red) / span + 2) / 6;
  } else {
    h = ((red - green) / span + 4) / 6;
  }
  return { h: h * 360, s, l, a };
};

/**
 * Reads the colour forms a style actually contains.
 *
 * Hex in three, six or eight digits, `rgb()`/`rgba()` and `hsl()`/`hsla()` —
 * measured against the served style rather than guessed at. Anything else,
 * including a named colour, returns null and is left exactly as it was: a colour
 * this cannot read is better drawn wrong-for-the-theme than drawn wrong.
 */
export const parseColor = (value: string): Hsl | null => {
  const text = value.trim().toLowerCase();

  const hex = /^#([0-9a-f]{3,8})$/.exec(text);
  if (hex) {
    const digits = hex[1];
    const wide = digits.length > 4;
    const step = wide ? 2 : 1;
    if (digits.length !== 3 && digits.length !== 4 && digits.length !== 6 && digits.length !== 8) {
      return null;
    }
    const part = (index: number) => {
      const slice = digits.slice(index * step, index * step + step);
      const full = wide ? slice : slice + slice;
      return parseInt(full, 16);
    };
    const alpha = digits.length === 4 || digits.length === 8 ? part(3) / 255 : 1;
    return rgbToHsl(part(0), part(1), part(2), alpha);
  }

  const rgb = /^rgba?\(([^)]+)\)$/.exec(text);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some((one) => Number.isNaN(one))) {
      return null;
    }
    return rgbToHsl(parts[0], parts[1], parts[2], parts[3] === undefined ? 1 : parts[3]);
  }

  const hsl = /^hsla?\(([^)]+)\)$/.exec(text);
  if (hsl) {
    const parts = hsl[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) {
      return null;
    }
    const numbers = parts.map((one) => Number(one.replace("%", "")));
    if (numbers.slice(0, 3).some((one) => Number.isNaN(one))) {
      return null;
    }
    return {
      h: numbers[0],
      s: clamp01(numbers[1] / 100),
      l: clamp01(numbers[2] / 100),
      a: numbers[3] === undefined ? 1 : numbers[3],
    };
  }

  return null;
};

/** How far saturation is pulled in. A hue gentle on white is loud on black. */
export const DARK_SATURATION = 0.8;

/**
 * The same colour as it should be drawn on a dark ground.
 *
 * Null where the value is not a colour this can read, which is the caller's
 * signal to leave it alone rather than to substitute something.
 */
export const darkened = (value: string): string | null => {
  const colour = parseColor(value);
  if (!colour) {
    return null;
  }
  const l = clamp01(1 - colour.l);
  const s = clamp01(colour.s * DARK_SATURATION);
  const alpha = colour.a === 1 ? "" : `, ${Number(colour.a.toFixed(3))}`;
  const open = alpha ? "hsla(" : "hsl(";
  return `${open}${Math.round(colour.h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%${alpha})`;
};

/**
 * The same paint value, recoloured wherever it holds a colour.
 *
 * A paint property is a colour, or an expression with colours at its leaves —
 * `["interpolate", ["linear"], ["zoom"], 5, "#e0e0e0", 12, "#ffffff"]`. Walking
 * it and transforming only what reads as a colour leaves the expression's own
 * structure, its stops and its operators exactly as the style wrote them.
 */
export const darkenPaintValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return darkened(value) ?? value;
  }
  if (Array.isArray(value)) {
    return value.map(darkenPaintValue);
  }
  return value;
};

/**
 * The colour-bearing paint properties of each kind of layer.
 *
 * Asked per layer type rather than tried against every layer. The renderer looks
 * a paint property up in the set its layer type declares and reads the result
 * without checking it, so asking a line layer for `fill-color` throws rather
 * than returning nothing — a whole-map recolour that guessed would fail on the
 * first layer it guessed wrong about.
 *
 * A type absent from here has no colour to invert: raster tiles carry an image,
 * and the shaded relief this style draws its terrain with is one.
 */
export const COLOUR_PAINT_KEYS: Record<string, readonly string[]> = {
  background: ["background-color"],
  fill: ["fill-color", "fill-outline-color"],
  line: ["line-color"],
  symbol: ["text-color", "text-halo-color", "icon-color", "icon-halo-color"],
  circle: ["circle-color", "circle-stroke-color"],
  "fill-extrusion": ["fill-extrusion-color"],
  heatmap: ["heatmap-color"],
  hillshade: ["hillshade-shadow-color", "hillshade-highlight-color", "hillshade-accent-color"],
};

/** The colour properties worth asking a layer of this type about. */
export const colourKeysFor = (type: string): readonly string[] => COLOUR_PAINT_KEYS[type] ?? [];
