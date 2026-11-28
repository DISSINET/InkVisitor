import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../../utils/test/renderForTest";
import { ElapsedSeconds } from "./ElapsedSeconds";

describe("ElapsedSeconds", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("counts up from the moment it was given, in tenths of a second", () => {
    const since = Date.now();
    const view = render(<ElapsedSeconds since={since} />);
    expect(view.container.textContent).toBe("0.0s");

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(view.container.textContent).toBe("1.5s");
    view.unmount();
  });

  it("is measured from `since`, not from when it was drawn", () => {
    const since = Date.now() - 4000;
    const view = render(<ElapsedSeconds since={since} />);
    expect(view.container.textContent).toBe("4.0s");
    view.unmount();
  });

  it("starts again when the run it counts is replaced by another", () => {
    const view = render(<ElapsedSeconds since={Date.now()} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    view.update(<ElapsedSeconds since={Date.now()} />);
    expect(view.container.textContent).toBe("0.0s");
    view.unmount();
  });

  it("stops ticking once it is gone", () => {
    const view = render(<ElapsedSeconds since={Date.now()} />);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
