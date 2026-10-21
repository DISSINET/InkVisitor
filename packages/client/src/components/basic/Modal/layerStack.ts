import { useEffect, useLayoutEffect, useRef } from "react";

// Escape and Ctrl+Enter go to the layer opened last: a confirmation opened over
// another modal closes itself and leaves the one beneath it standing. A layer
// is anything that closes on Escape - every Modal, and the annotator highlight
// menu, which is a popover rather than a Modal.
//
// One window listener serves every layer, so the key reaches the top layer
// alone, whatever order the layers were mounted in.
//
// A layer that closes itself from its own React key handler must stop the key
// there. React 18 commits that close, and takes the layer off the stack, before
// the key reaches the window, so the same press would go on to the layer below.

export interface KeyLayer {
  onEscape?: () => void;
  onCtrlEnter?: () => void;
}

const layers: KeyLayer[] = [];

const handleKeyDown = (e: KeyboardEvent) => {
  const top = layers[layers.length - 1];
  if (!top || e.shiftKey || e.altKey) {
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    top.onEscape?.();
  } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    top.onCtrlEnter?.();
  }
};

/** Puts the layer on top of the stack; the returned function takes it off. */
export const pushLayer = (layer: KeyLayer): (() => void) => {
  if (layers.length === 0) {
    window.addEventListener("keydown", handleKeyDown);
  }
  layers.push(layer);
  return () => {
    const index = layers.lastIndexOf(layer);
    if (index !== -1) {
      layers.splice(index, 1);
    }
    if (layers.length === 0) {
      window.removeEventListener("keydown", handleKeyDown);
    }
  };
};

/** true while any layer is open; page-level key shortcuts yield to it */
export const isAnyLayerOpen = (): boolean => layers.length > 0;

/**
 * Keeps a layer on the stack while `active`. The handlers may change on every
 * render; the layer always calls the latest ones.
 */
export const useKeyLayer = (active: boolean, handlers: KeyLayer): void => {
  const handlersRef = useRef(handlers);
  useLayoutEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!active) {
      return;
    }
    return pushLayer({
      onEscape: () => handlersRef.current.onEscape?.(),
      onCtrlEnter: () => handlersRef.current.onCtrlEnter?.(),
    });
  }, [active]);
};
