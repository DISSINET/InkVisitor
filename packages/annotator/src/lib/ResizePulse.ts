/**
 * Drives the pulsing accent shown on the anchor being resized (#2885).
 *
 * Like {@link CaretBlink}, the annotator renders on demand, so the pulse is a
 * small self-contained timer: while active it advances a phase and asks the
 * host to repaint via `onTick`. The host reads {@link intensity} (a smooth
 * 0→1→0 triangle wave) to modulate the accent's opacity. The timer only runs
 * while resize mode is active, so it is idle (and cheap) the rest of the time.
 */

/** Redraw cadence while pulsing. ~11 fps — smooth enough for an opacity fade, cheap. */
export const RESIZE_PULSE_INTERVAL_MS = 90;
/** Full 0→1→0 cycle length. */
export const RESIZE_PULSE_PERIOD_MS = 1100;

export class ResizePulse {
  private timer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private startedAt = 0;

  constructor(
    private readonly onTick: () => void,
    private readonly intervalMs: number = RESIZE_PULSE_INTERVAL_MS,
    private readonly periodMs: number = RESIZE_PULSE_PERIOD_MS
  ) {}

  /** Whether the pulse is currently running. */
  isActive(): boolean {
    return this.timer !== null;
  }

  /**
   * Smooth accent strength in [0, 1] as a triangle wave over {@link periodMs}:
   * 0 at the start of a cycle, 1 at the half-cycle, back to 0. Returns 0 when
   * inactive so a stray read paints nothing.
   */
  intensity(): number {
    if (this.timer === null) {
      return 0;
    }
    const elapsed = (Date.now() - this.startedAt) % this.periodMs;
    const half = this.periodMs / 2;
    return elapsed <= half ? elapsed / half : (this.periodMs - elapsed) / half;
  }

  /** Start pulsing (idempotent — never restarts an in-flight phase). */
  start(): void {
    if (this.destroyed || this.timer !== null) {
      return;
    }
    this.startedAt = Date.now();
    this.timer = setInterval(this.tick, this.intervalMs);
  }

  /** Stop pulsing. A later start() begins a fresh phase. */
  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Stop the timer permanently (host teardown). */
  destroy(): void {
    this.destroyed = true;
    this.stop();
  }

  private readonly tick = (): void => {
    this.onTick();
  };
}
