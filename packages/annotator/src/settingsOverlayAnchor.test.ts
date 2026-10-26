/**
 * The settings overlay backdrop spans the whole editor surface: the line-number
 * canvas and the scroller are elements beside the text canvas, so anchoring to
 * the text canvas alone left the box squeezed into the narrower column.
 */
import { SettingsOverlay } from "./lib/SettingsOverlay";

/** jsdom has no layout, so anchors carry the rect the test wants them to report. */
const anchorAt = (left: number, top: number, width: number, height: number) => {
  const el = document.createElement("div");
  el.getBoundingClientRect = () =>
    ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
  document.body.appendChild(el);
  return el;
};

const backdropOf = () => document.body.lastElementChild as HTMLElement;

describe("SettingsOverlay anchoring", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("a single anchor covers that element's box", () => {
    new SettingsOverlay().open([], anchorAt(50, 10, 300, 400));

    const backdrop = backdropOf();
    expect(backdrop.style.left).toBe("50px");
    expect(backdrop.style.top).toBe("10px");
    expect(backdrop.style.width).toBe("300px");
    expect(backdrop.style.height).toBe("400px");
  });

  test("several anchors cover their union", () => {
    const lineNumbers = anchorAt(20, 10, 30, 400);
    const canvas = anchorAt(50, 10, 300, 400);
    const scroller = anchorAt(350, 10, 14, 400);

    new SettingsOverlay().open([], [lineNumbers, canvas, scroller]);

    const backdrop = backdropOf();
    expect(backdrop.style.left).toBe("20px");
    expect(backdrop.style.top).toBe("10px");
    expect(backdrop.style.width).toBe("344px");
    expect(backdrop.style.height).toBe("400px");
  });

  test("anchors with no box (hidden line numbers) do not pull the union", () => {
    const hidden = anchorAt(0, 0, 0, 0);
    const canvas = anchorAt(50, 10, 300, 400);

    new SettingsOverlay().open([], [hidden, canvas]);

    const backdrop = backdropOf();
    expect(backdrop.style.left).toBe("50px");
    expect(backdrop.style.width).toBe("300px");
  });

  test("reposition re-anchors to the new element set", () => {
    const canvas = anchorAt(50, 10, 300, 400);
    const lineNumbers = anchorAt(20, 10, 30, 400);
    const overlay = new SettingsOverlay();
    overlay.open([], canvas);
    const backdrop = backdropOf();

    overlay.reposition([lineNumbers, canvas]);

    expect(backdrop.style.left).toBe("20px");
    expect(backdrop.style.width).toBe("330px");
  });
});
