import { SpringValue } from "@react-spring/web";
import { springConfig } from "Theme/constants";
import {
  writeBoxHeightVars,
  writePanelWidthVars,
  writeSeparatorPositionVars,
} from "./layoutUtils";

type LayoutValues = Record<string, number | undefined>;

/**
 * Springs a family of layout CSS variables towards a target.
 *
 * The variables have two writers, wanting different things. A drag knows the
 * exact position for this frame and wants it on screen now; a toggle knows only
 * where the layout should end up, and how it travels there is the whole point.
 * {@link set} serves the first, {@link animate} the second.
 *
 * One spring drives the family as a 0..1 progress rather than one spring per
 * variable, so every value crosses its own distance on the same curve. The
 * widths of a row therefore still sum to the row's width at every instant,
 * overshoot included.
 */
class LayoutTransition {
  private readonly progress = new SpringValue(1);
  private from: LayoutValues | undefined;
  private target: LayoutValues | undefined;

  constructor(private readonly write: (values: LayoutValues) => void) {}

  /** Put the variables at these values now, ending any animation. */
  set(values: LayoutValues): void {
    this.progress.stop();
    this.progress.set(1);
    this.from = values;
    this.target = values;
    this.write(values);
  }

  /** Spring the variables from wherever they are to these values. */
  animate(values: LayoutValues): void {
    // Callers reassert their target on every render, and restarting the spring
    // from a fraction of the way through would leave it never arriving.
    if (this.target && sameValues(this.target, values)) {
      return;
    }

    const current = this.currentValues();
    if (!current) {
      // The first layout is not a transition - there is nothing to travel from.
      this.set(values);
      return;
    }

    this.from = current;
    this.target = values;
    this.progress.stop();
    this.progress.set(0);
    this.progress.start(1, {
      config: springConfig.panelExpand,
      onChange: () => this.paint(),
      onRest: () => this.paint(),
    });
  }

  private paint(): void {
    const values = this.currentValues();
    if (values) {
      this.write(values);
    }
  }

  /** What the variables hold right now, which a new animation starts from. */
  private currentValues(): LayoutValues | undefined {
    const { from, target } = this;
    if (!from || !target) {
      return undefined;
    }

    const travelled = this.progress.get();
    const values: LayoutValues = {};

    Object.keys(target).forEach((key) => {
      const start = from[key];
      const end = target[key];
      // A value that is not a number at both ends has nothing to interpolate;
      // the writers skip those, which leaves the variable as it was.
      values[key] =
        start === undefined || end === undefined
          ? end
          : start + (end - start) * travelled;
    });

    return values;
  }
}

const sameValues = (a: LayoutValues, b: LayoutValues): boolean => {
  const keys = Object.keys(b);
  return (
    keys.length === Object.keys(a).length && keys.every((key) => a[key] === b[key])
  );
};

// Panel widths arrive as a list, keyed here by index - which is what their
// variables are named after anyway.
const byIndex = (widths: (number | undefined)[]): LayoutValues =>
  Object.fromEntries(widths.map((width, index) => [index, width]));

const panelWidths = new LayoutTransition((values) =>
  writePanelWidthVars([values[0], values[1], values[2], values[3]]),
);
const boxHeights = new LayoutTransition(writeBoxHeightVars);
const separatorPositions = new LayoutTransition(writeSeparatorPositionVars);

export const animatePanelWidthVars = (widths: (number | undefined)[]): void =>
  panelWidths.animate(byIndex(widths));

export const setPanelWidthVars = (widths: (number | undefined)[]): void =>
  panelWidths.set(byIndex(widths));

export const animateBoxHeightVars = (heights: LayoutValues): void =>
  boxHeights.animate(heights);

export const setBoxHeightVars = (heights: LayoutValues): void =>
  boxHeights.set(heights);

export const animateSeparatorPositionVars = (positions: LayoutValues): void =>
  separatorPositions.animate(positions);

export const setSeparatorPositionVars = (positions: LayoutValues): void =>
  separatorPositions.set(positions);
