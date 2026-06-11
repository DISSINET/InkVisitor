/**
 * Drives the text caret's blink phase (#3092).
 *
 * The annotator renders on demand (no continuous loop), so the blink is a small
 * self-contained timer: while a caret is shown it flips visibility every
 * {@link CARET_BLINK_INTERVAL_MS} and asks the host to repaint via `onToggle`.
 * The host decides *when* a caret is shown and feeds that in through `sync`,
 * keeping the timer idle (and cheap) whenever there is nothing to blink.
 */

/** Half-period of the blink: 500ms visible + 500ms hidden = one cycle/second. */
export const CARET_BLINK_INTERVAL_MS = 500;

export class CaretBlink {
  private visible = true;
  private timer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  constructor(
    private readonly onToggle: () => void,
    private readonly intervalMs: number = CARET_BLINK_INTERVAL_MS
  ) {}

  /** Whether the caret should be painted on this frame. */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Start or stop blinking to match whether a caret is currently shown.
   * Starting is idempotent: it never restarts an in-flight blink phase.
   */
  sync(shouldBlink: boolean): void {
    if (shouldBlink) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * Force the caret solid and restart the phase. Used on user activity (click,
   * keystroke) so the caret is visible the instant the cursor moves rather than
   * possibly mid-"off". The caller is expected to repaint afterwards.
   */
  reset(): void {
    this.visible = true;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = setInterval(this.tick, this.intervalMs);
    }
  }

  /** Stop the timer permanently (host teardown); a later sync() cannot revive it. */
  destroy(): void {
    this.destroyed = true;
    this.stop();
  }

  private start(): void {
    if (this.destroyed || this.timer !== null) {
      return;
    }
    this.timer = setInterval(this.tick, this.intervalMs);
  }

  private stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.visible = true;
  }

  private readonly tick = (): void => {
    this.visible = !this.visible;
    this.onToggle();
  };
}
