import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useKeypress from "./useKeyPress";

const CtrlF = ({ onPress }: { onPress: () => void }) => {
  useKeypress("f", onPress, undefined, true);
  return null;
};

const press = (init: KeyboardEventInit) =>
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "f", cancelable: true, ...init }));

describe("useKeypress with ctrlKeyCombo", () => {
  let root: Root;
  let container: HTMLDivElement;
  const onPress = vi.fn();

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    root = createRoot(container);
    act(() => root.render(<CtrlF onPress={onPress} />));
  });

  afterEach(() => {
    act(() => root.unmount());
    onPress.mockClear();
  });

  it("fires on Ctrl+F and on Cmd+F", () => {
    press({ ctrlKey: true });
    press({ metaKey: true });

    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("leaves Ctrl+Cmd+F to the system and does not block it", () => {
    const event = new KeyboardEvent("keydown", {
      key: "f",
      ctrlKey: true,
      metaKey: true,
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(onPress).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores F without Ctrl or Cmd", () => {
    press({});

    expect(onPress).not.toHaveBeenCalled();
  });
});
