/**
 * Discriminator for the kinds of warnings the annotator can emit.
 * Add new variants here when introducing additional detection checks.
 */
export enum WarningType {
  AsymmetricalAnchor = "asymmetrical-anchor",
}

/**
 * Represents an asymmetrical (broken) anchor in the text
 */
export interface AsymmetricalAnchor {
  tagName: string;
  type: "orphaned-opening" | "orphaned-closing";
  segmentIndex: number;
  position: number;
  attributes?: Record<string, string>;
}

export interface AsymmetricalAnchorWarning {
  type: WarningType.AsymmetricalAnchor;
  anchors: AsymmetricalAnchor[];
}

export type WarningData = AsymmetricalAnchorWarning;

/**
 * Warnings system for the Annotator. Acts as a notification bus: detection
 * logic lives in `Annotator.runWarningChecks`, which calls `emit*` methods
 * here. Subscribers can listen via `onWarning` (string summary, e.g. for a
 * toaster) and/or `onWarningData` (structured payload for richer UI).
 */
export class Warnings {
  private enabled: boolean = true;
  private onWarningCb?: (message: string, type: WarningType) => void;
  private onWarningDataCb?: (data: WarningData) => void;
  private currentWarnings: WarningData | null = null;
  private lastEmittedKey: string | null = null;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  onWarning(cb: (message: string, type: WarningType) => void): void {
    this.onWarningCb = cb;
  }

  onWarningData(cb: (data: WarningData) => void): void {
    this.onWarningDataCb = cb;
  }

  emitAsymmetricalAnchors(anchors: AsymmetricalAnchor[]): void {
    if (!this.enabled) {
      return;
    }

    const key = anchorsKey(anchors);
    if (key === this.lastEmittedKey) {
      return;
    }
    this.lastEmittedKey = key;

    this.currentWarnings =
      anchors.length > 0
        ? { type: WarningType.AsymmetricalAnchor, anchors }
        : null;

    this.onWarningDataCb?.({
      type: WarningType.AsymmetricalAnchor,
      anchors,
    });

    if (this.onWarningCb && anchors.length > 0) {
      this.onWarningCb(
        formatAsymmetricalAnchorMessage(anchors),
        WarningType.AsymmetricalAnchor
      );
    }
  }

  getCurrentWarnings(): WarningData | null {
    return this.currentWarnings;
  }

  clearWarnings(): void {
    this.currentWarnings = null;
    this.lastEmittedKey = null;
  }
}

function anchorsKey(anchors: AsymmetricalAnchor[]): string {
  return anchors
    .map(
      (a) => `${a.tagName}|${a.type}|${a.segmentIndex}|${a.position}`
    )
    .sort()
    .join(",");
}

function formatAsymmetricalAnchorMessage(
  anchors: AsymmetricalAnchor[]
): string {
  const opening = anchors.filter((a) => a.type === "orphaned-opening").length;
  const closing = anchors.filter((a) => a.type === "orphaned-closing").length;
  const parts: string[] = [];
  if (opening > 0) {
    parts.push(
      `${opening} orphaned opening tag${opening === 1 ? "" : "s"}`
    );
  }
  if (closing > 0) {
    parts.push(
      `${closing} orphaned closing tag${closing === 1 ? "" : "s"}`
    );
  }
  return `Asymmetrical anchor${anchors.length === 1 ? "" : "s"} detected: ${parts.join(", ")}`;
}
