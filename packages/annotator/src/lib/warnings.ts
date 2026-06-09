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
  /** Human-readable summary (empty when the warning is cleared). */
  message: string;
  anchors: AsymmetricalAnchor[];
}

/**
 * Discriminated union of every warning the annotator can emit. Each variant
 * carries its `type`, a `message` summary, and its own typed metadata.
 */
export type WarningData = AsymmetricalAnchorWarning;

/**
 * Warnings system for the Annotator. Acts as a notification bus: detection
 * logic lives in `Annotator.runWarningChecks`, which calls `emit*` methods
 * here. Subscribers listen via a single `onWarning` hook that receives the
 * full `WarningData` (type + message + metadata) on every change, including
 * the cleared state (metadata becomes empty), so UIs can react and reset.
 */
export class Warnings {
  private enabled: boolean = true;
  private onWarningCb?: (warning: WarningData) => void;
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

  onWarning(cb: (warning: WarningData) => void): void {
    this.onWarningCb = cb;
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

    const warning: AsymmetricalAnchorWarning = {
      type: WarningType.AsymmetricalAnchor,
      message:
        anchors.length > 0 ? formatAsymmetricalAnchorMessage(anchors) : "",
      anchors,
    };

    this.currentWarnings = anchors.length > 0 ? warning : null;

    this.onWarningCb?.(warning);
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
