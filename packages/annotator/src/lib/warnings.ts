/**
 * Represents an asymmetrical (broken) anchor in the text
 */
export interface AsymmetricalAnchor {
  tagName: string;
  type: 'orphaned-opening' | 'orphaned-closing';
  segmentIndex: number;
  position: number;
  attributes?: Record<string, string>;
}

export interface WarningData {
  type: 'asymmetrical-anchor';
  anchors: AsymmetricalAnchor[];
}

/**
 * Warnings system for the Annotator
 * Handles warning messages and notifications for various annotator operations
 */
export class Warnings {
  private enabled: boolean = true;
  private onWarningCb?: (message: string) => void;
  private onWarningDataCb?: (data: WarningData) => void;
  private currentWarnings: WarningData | null = null;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Enable warnings system
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable warnings system
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if warnings are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set callback for warning events
   */
  onWarning(cb: (message: string) => void): void {
    this.onWarningCb = cb;
  }

  /**
   * Set callback for structured warning data
   */
  onWarningData(cb: (data: WarningData) => void): void {
    this.onWarningDataCb = cb;
  }

  /**
   * Trigger a warning
   */
  warn(message: string): void {
    if (!this.enabled || !this.onWarningCb) {
      return;
    }
    
    this.onWarningCb(message);
  }

  /**
   * Emit asymmetrical anchor warnings
   */
  emitAsymmetricalAnchors(anchors: AsymmetricalAnchor[]): void {
    if (!this.enabled || !this.onWarningDataCb) {
      return;
    }

    this.currentWarnings = {
      type: 'asymmetrical-anchor',
      anchors,
    };

    this.onWarningDataCb(this.currentWarnings);
  }

  /**
   * Get current warnings without triggering callback
   */
  getCurrentWarnings(): WarningData | null {
    return this.currentWarnings;
  }

  /**
   * Clear current warnings
   */
  clearWarnings(): void {
    this.currentWarnings = null;
  }

  /**
   * Called when text changes in the annotator
   * Performs various checks on the text content
   */
  onTextChanged(text: string): void {
    if (!this.enabled) {
      return;
    }

    this.checkOverlappingXmlTags(text);
  }

  /**
   * Internal method to check for overlapping XML tag issues
   * TODO: Implement logic to detect overlapping XML tags
   */
  private checkOverlappingXmlTags(text: string): void {
    // TODO: Implement overlapping XML tag detection logic
    // This method should analyze the text for XML tag overlapping issues
    // and call this.warn() with appropriate warning messages
  }
}