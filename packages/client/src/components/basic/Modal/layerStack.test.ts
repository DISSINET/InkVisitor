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

  it("sends Ctrl+Enter and Cmd+Enter to the last opened layer only", () => {
    const batch = { onCtrlEnter: vi.fn() };
    const confirm = { onCtrlEnter: vi.fn() };

    withLayers([batch, confirm], () => {
      press("Enter", { ctrlKey: true });
      press("Enter", { metaKey: true });
    });

    expect(confirm.onCtrlEnter).toHaveBeenCalledTimes(2);
    expect(batch.onCtrlEnter).not.toHaveBeenCalled();
  });

  it("keeps Ctrl+Enter from the layer below when the top layer has no handler for it", () => {
    const batch = { onCtrlEnter: vi.fn() };
    const panel = { onEscape: vi.fn() };

    withLayers([batch, panel], () => press("Enter", { ctrlKey: true }));

    expect(batch.onCtrlEnter).not.toHaveBeenCalled();
  });

  it("leaves plain Enter alone", () => {
    const top = { onCtrlEnter: vi.fn() };

    withLayers([top], () => press("Enter"));

    expect(top.onCtrlEnter).not.toHaveBeenCalled();
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

  it("listens on the window only while a layer is open", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    try {
      const removeFirst = pushLayer({});
      const removeSecond = pushLayer({});
      expect(add).toHaveBeenCalledTimes(1);

      removeFirst();
      expect(remove).not.toHaveBeenCalled();

      removeSecond();
      expect(remove).toHaveBeenCalledTimes(1);
      expect(remove).toHaveBeenCalledWith("keydown", add.mock.calls[0][1]);
    } finally {
      add.mockRestore();
      remove.mockRestore();
    }
  });

  it("reports a layer open until the last one closes", () => {
    withLayers([{}, {}], () => expect(isAnyLayerOpen()).toBe(true));

    expect(isAnyLayerOpen()).toBe(false);
  });
});
