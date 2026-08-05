/**
 * Browser zoom reaches the canvas two ways: as ctrl-modified wheel events (what
 * a macOS trackpad pinch is delivered as), and as a devicePixelRatio change.
 */
import { Annotator } from "./lib/Annotator";

const setDpr = (value: number) => {
  Object.defineProperty(window, "devicePixelRatio", {
    value,
    configurable: true,
    writable: true,
  });
};

const mk = (ratio = 2): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "400px";
  c.style.height = "600px";
  document.body.appendChild(c);
  return new Annotator(c, "foo bar baz qux quux corge grault garply", ratio);
};

const wheel = (init: Partial<WheelEvent>) => {
  let defaultPrevented = false;
  const e = {
    deltaY: 100,
    ctrlKey: false,
    metaKey: false,
    preventDefault: () => {
      defaultPrevented = true;
    },
    ...init,
  } as unknown as WheelEvent;
  return { e, prevented: () => defaultPrevented };
};

describe("wheel zoom gestures", () => {
  afterEach(() => setDpr(1));

  test("a plain wheel scrolls and swallows the event", () => {
    const a = mk();
    const { e, prevented } = wheel({ deltaY: 120 });

    a.onWheel(e);

    expect(a.viewport.scrollOffsetY).toBeGreaterThan(0);
    expect(prevented()).toBe(true);
  });

  test("ctrl+wheel (trackpad pinch) neither scrolls nor blocks page zoom", () => {
    const a = mk();
    const { e, prevented } = wheel({ deltaY: 120, ctrlKey: true });

    a.onWheel(e);

    expect(a.viewport.scrollOffsetY).toBe(0);
    expect(prevented()).toBe(false);
  });

  test("meta+wheel is left to the browser too", () => {
    const a = mk();
    const { e, prevented } = wheel({ deltaY: 120, metaKey: true });

    a.onWheel(e);

    expect(a.viewport.scrollOffsetY).toBe(0);
    expect(prevented()).toBe(false);
  });
});

describe("device pixel ratio", () => {
  afterEach(() => setDpr(1));

  test("a DPR above the host's ratio raises the backing store on resize", () => {
    const a = mk(2);
    expect(a.ratio).toBe(2);
    const fontAt2x = a.font;

    setDpr(3);
    a.resize();

    expect(a.ratio).toBe(3);
    expect(a.element.width).toBe(400 * 3);
    expect(a.element.height).toBe(600 * 3);
    expect(a.font).not.toBe(fontAt2x);
    expect(a.cursor.ratio).toBe(3);
  });

  test("a DPR below the host's ratio leaves the supersampling alone", () => {
    setDpr(1);
    const a = mk(2);

    a.resize();

    expect(a.ratio).toBe(2);
    expect(a.element.width).toBe(400 * 2);
  });

  test("the ratio in effect at construction already accounts for zoom", () => {
    setDpr(4);
    const a = mk(2);

    expect(a.ratio).toBe(4);
    expect(a.element.width).toBe(400 * 4);
  });
});
