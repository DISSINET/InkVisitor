/**
 * Fades the statement-list hover highlight in and out (#2835).
 *
 * The highlight is drawn on the canvas, so a CSS transition can't touch it. Like
 * {@link ResizePulse}, the annotator renders on demand, so this is a small
 * self-contained timer: while animating it eases a factor toward a target (1 =
 * shown, 0 = hidden) and asks the host to repaint via `onTick`. The host reads
 * {@link value} (0→1) and multiplies it into the highlight's opacity. The timer
 * only runs during a transition, so it is idle (and cheap) the rest of the time.
 */

/** Redraw cadence while fading. ~60 fps for a smooth opacity ramp. */
export const HOVER_FADE_INTERVAL_MS = 16;
/** How long a full 0↔1 fade takes. */
export const HOVER_FADE_DURATION_MS = 200;

export class HoverHighlightFade {
  private timer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private startedAt = 0;
  private from = 0;
  private target: 0 | 1 = 0;
  private current = 0;

  constructor(
    private readonly onTick: () => void,
    private readonly intervalMs: number = HOVER_FADE_INTERVAL_MS,
    private readonly durationMs: number = HOVER_FADE_DURATION_MS
  ) {}

  /** Whether a fade is currently running. */
  isActive(): boolean {
    return this.timer !== null;
  }

  /** Current eased opacity factor in [0, 1]. */
  value(): number {
    return this.current;
  }

  /**
   * Hard-set the current factor without animating. Used to restart the incoming
   * highlight from 0 when cross-fading between two anchors, so the next {@link to}
   * ramps up from zero instead of holding at the previous value.
   */
  setValue(v: number): void {
    this.current = v;
  }

  /**
   * Animate toward `target` (1 = show, 0 = hide) from the current value, so a
   * reversal mid-fade picks up smoothly instead of snapping. A no-op when already
   * settled at the target.
   */
  to(target: 0 | 1): void {
    if (this.destroyed) {
      return;
    }
    if (this.current === target && this.timer === null) {
      return;
    }
    this.from = this.current;
    this.target = target;
    this.startedAt = Date.now();
    if (this.timer === null) {
      this.timer = setInterval(this.tick, this.intervalMs);
    }
  }

  /** Stop the timer permanently (host teardown). */
  destroy(): void {
    this.destroyed = true;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private readonly tick = (): void => {
    const elapsed = Date.now() - this.startedAt;
    const t = Math.min(1, elapsed / this.durationMs);
    // smoothstep easing (0→1) so the ramp accelerates and settles gently.
    const eased = t * t * (3 - 2 * t);
    this.current = this.from + (this.target - this.from) * eased;
    if (t >= 1) {
      this.current = this.target;
      if (this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
    this.onTick();
  };
}
