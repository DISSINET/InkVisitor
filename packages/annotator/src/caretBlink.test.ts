/**
 * #3092 — CaretBlink controller.
 *
 * Owns the caret blink phase and the interval timer. Default cadence is one full
 * cycle per second (500ms visible / 500ms hidden). The controller drives nothing
 * itself beyond an `onToggle` callback the host uses to repaint.
 */
import { CaretBlink, CARET_BLINK_INTERVAL_MS } from "./lib/CaretBlink";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("CaretBlink", () => {
  test("interval constant is 500ms (one blink cycle per second)", () => {
    expect(CARET_BLINK_INTERVAL_MS).toBe(500);
  });

  test("starts visible", () => {
    const b = new CaretBlink(() => {});
    expect(b.isVisible()).toBe(true);
  });

  test("toggles visibility every 500ms while syncing a caret, calling onToggle", () => {
    const onToggle = jest.fn();
    const b = new CaretBlink(onToggle);
    b.sync(true);

    expect(b.isVisible()).toBe(true);
    expect(onToggle).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(b.isVisible()).toBe(false);
    expect(onToggle).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(b.isVisible()).toBe(true);
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  test("sync(false) stops blinking and leaves the caret visible", () => {
    const onToggle = jest.fn();
    const b = new CaretBlink(onToggle);
    b.sync(true);
    jest.advanceTimersByTime(500); // now hidden
    expect(b.isVisible()).toBe(false);

    b.sync(false);
    expect(b.isVisible()).toBe(true);

    onToggle.mockClear();
    jest.advanceTimersByTime(2000);
    expect(onToggle).not.toHaveBeenCalled();
    expect(b.isVisible()).toBe(true);
  });

  test("sync(true) is idempotent — it does not restart the phase", () => {
    const b = new CaretBlink(() => {});
    b.sync(true);
    jest.advanceTimersByTime(300);
    b.sync(true); // must NOT reset the 500ms phase
    jest.advanceTimersByTime(200); // 500ms total since first sync
    expect(b.isVisible()).toBe(false);
  });

  test("reset() re-solidifies the caret and restarts the phase", () => {
    const b = new CaretBlink(() => {});
    b.sync(true);
    jest.advanceTimersByTime(500); // hidden
    expect(b.isVisible()).toBe(false);

    b.reset();
    expect(b.isVisible()).toBe(true);

    jest.advanceTimersByTime(300); // phase restarted → still visible
    expect(b.isVisible()).toBe(true);
    jest.advanceTimersByTime(200); // 500ms since reset → hidden again
    expect(b.isVisible()).toBe(false);
  });

  test("destroy() stops the timer", () => {
    const onToggle = jest.fn();
    const b = new CaretBlink(onToggle);
    b.sync(true);

    b.destroy();
    jest.advanceTimersByTime(2000);
    expect(onToggle).not.toHaveBeenCalled();
  });

  test("destroy() is terminal — sync(true) cannot restart the timer", () => {
    const onToggle = jest.fn();
    const b = new CaretBlink(onToggle);
    b.destroy();

    b.sync(true);
    jest.advanceTimersByTime(2000);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
