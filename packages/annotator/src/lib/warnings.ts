/**
 * Warnings system for the Annotator
 * Handles warning messages and notifications for various annotator operations
 */
export class Warnings {
  private enabled: boolean = true;
  private onWarningCb?: (message: string) => void;

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
   * Trigger a warning
   */
  warn(message: string): void {
    if (!this.enabled || !this.onWarningCb) {
      return;
    }
    
    this.onWarningCb(message);
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