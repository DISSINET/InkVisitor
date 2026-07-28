import { SpringValue } from "@react-spring/web";
import { springConfig } from "Theme/constants";
import {
  writeBoxHeightVars,
  writePanelWidthVars,
  writeSeparatorPositionVars,
} from "./layoutUtils";

type LayoutValues = Record<string, number | undefined>;

/**
 * Which layout a set of values belongs to.
 *
 * The variables are global and keyed by position, so the same variable is a
 * different panel on a different page - MainPage's tree panel and the query
 * page's left panel are both "panel 0". Values continue from the same owner's
 * values and from nobody else's; interpolating across owners would animate
 * between two things that were never the same thing.
 */
export type LayoutOwner = "mainPage" | "explorerPage";

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
  private owner: LayoutOwner | undefined;
  private from: LayoutValues | undefined;
  private target: LayoutValues | undefined;

  constructor(private readonly write: (values: LayoutValues) => void) {}

  /** Put the variables at these values now, ending any animation. */
  set(values: LayoutValues, owner: LayoutOwner): void {
    this.progress.stop();
    this.progress.set(1);
    this.owner = owner;
    this.from = values;
    this.target = values;
    this.write(values);
  }

  /** Spring the variables from wherever they are to these values. */
  animate(values: LayoutValues, owner: LayoutOwner): void {
    // Callers reassert their target on every render, and restarting the spring
    // from a fraction of the way through would leave it never arriving.
    if (this.owner === owner && this.target && sameValues(this.target, values)) {
      return;
    }

    const { target } = this;
    const current = this.currentValues();
    // Nothing to travel from: the first layout, another layout's values in these
    // variables, or a different set of variables than the last caller wrote.
    if (
      this.owner !== owner ||
      !target ||
      !current ||
      !sameKeys(target, values)
    ) {
      this.set(values, owner);
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

const sameKeys = (a: LayoutValues, b: LayoutValues): boolean => {
  const keys = Object.keys(b);
  return keys.length === Object.keys(a).length && keys.every((key) => key in a);
};

const sameValues = (a: LayoutValues, b: LayoutValues): boolean =>
  sameKeys(a, b) && Object.keys(b).every((key) => a[key] === b[key]);

// Panel widths arrive as a list, keyed here by index - which is what their
// variables are named after anyway.
const byIndex = (widths: (number | undefined)[]): LayoutValues =>
  Object.fromEntries(widths.map((width, index) => [index, width]));

const panelWidths = new LayoutTransition((values) =>
  writePanelWidthVars([values[0], values[1], values[2], values[3]]),
);
const boxHeights = new LayoutTransition(writeBoxHeightVars);
const separatorPositions = new LayoutTransition(writeSeparatorPositionVars);

export const animatePanelWidthVars = (
  widths: (number | undefined)[],
  owner: LayoutOwner,
): void => panelWidths.animate(byIndex(widths), owner);

export const setPanelWidthVars = (
  widths: (number | undefined)[],
  owner: LayoutOwner,
): void => panelWidths.set(byIndex(widths), owner);

export const animateBoxHeightVars = (
  heights: LayoutValues,
  owner: LayoutOwner,
): void => boxHeights.animate(heights, owner);

export const setBoxHeightVars = (
  heights: LayoutValues,
  owner: LayoutOwner,
): void => boxHeights.set(heights, owner);

export const animateSeparatorPositionVars = (
  positions: LayoutValues,
  owner: LayoutOwner,
): void => separatorPositions.animate(positions, owner);

export const setSeparatorPositionVars = (
  positions: LayoutValues,
  owner: LayoutOwner,
): void => separatorPositions.set(positions, owner);
