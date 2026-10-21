import { describe, expect, it, vi } from "vitest";
import { isAnyLayerOpen, KeyLayer, pushLayer } from "./layerStack";

// the stack is module state shared by every layer, so each test takes off the
// layers it opened
const withLayers = <T>(layers: KeyLayer[], assert: () => T): T => {
  const removes = layers.map(pushLayer);
  try {
    return assert();
  } finally {
    removes.forEach((remove) => remove());
  }
};

const press = (key: string, init: KeyboardEventInit = {}) =>
  window.dispatchEvent(new KeyboardEvent("keydown", { key, ...init }));

describe("layerStack", () => {
  it("sends Escape to the last opened layer only", () => {
    const batch = { onEscape: vi.fn() };
    const confirm = { onEscape: vi.fn() };

    withLayers([batch, confirm], () => press("Escape"));

    expect(confirm.onEscape).toHaveBeenCalledTimes(1);
    expect(batch.onEscape).not.toHaveBeenCalled();
  });

  it("hands the top back to the layer underneath when the top closes", () => {
    const batch = { onEscape: vi.fn() };
    const confirm = { onEscape: vi.fn() };

    withLayers([batch], () => {
      pushLayer(confirm)();
      press("Escape");
    });

    expect(batch.onEscape).toHaveBeenCalledTimes(1);
    expect(confirm.onEscape).not.toHaveBeenCalled();
  });

  it("keeps the top when a layer below it closes", () => {
    const first = { onEscape: vi.fn() };
    const second = { onEscape: vi.fn() };
    const third = { onEscape: vi.fn() };

    withLayers([first], () => {
      const removeSecond = pushLayer(second);
      withLayers([third], () => {
        removeSecond();
        press("Escape");
      });
    });

    expect(third.onEscape).toHaveBeenCalledTimes(1);
    expect(first.onEscape).not.toHaveBeenCalled();
  });

  it("sends Ctrl+Enter and Cmd+Enter to the top layer, plain Enter to none", () => {
    const top = { onCtrlEnter: vi.fn() };

    withLayers([top], () => {
      press("Enter");
      press("Enter", { ctrlKey: true });
      press("Enter", { metaKey: true });
    });

    expect(top.onCtrlEnter).toHaveBeenCalledTimes(2);
  });

  it("ignores the keys with Shift or Alt held", () => {
    const top = { onEscape: vi.fn(), onCtrlEnter: vi.fn() };

    withLayers([top], () => {
      press("Escape", { shiftKey: true });
      press("Escape", { altKey: true });
      press("Enter", { ctrlKey: true, shiftKey: true });
    });

    expect(top.onEscape).not.toHaveBeenCalled();
    expect(top.onCtrlEnter).not.toHaveBeenCalled();
  });

  it("stops listening once every layer has closed", () => {
    const only = { onEscape: vi.fn() };

    pushLayer(only)();
    press("Escape");

    expect(only.onEscape).not.toHaveBeenCalled();
    expect(isAnyLayerOpen()).toBe(false);
  });

  it("reports a layer open until the last one closes", () => {
    withLayers([{}, {}], () => expect(isAnyLayerOpen()).toBe(true));

    expect(isAnyLayerOpen()).toBe(false);
  });
});
