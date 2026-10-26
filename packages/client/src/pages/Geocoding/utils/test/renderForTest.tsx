import React, { act } from "react";
import { Root, createRoot } from "react-dom/client";
import { ThemeProvider } from "styled-components";
import theme from "Theme/theme";

/**
 * Rendering a component in a test without adding a testing library.
 *
 * Vitest already runs these files under jsdom, and React ships its own `act`,
 * so a root and the DOM are all that is needed. Queries are plain
 * `querySelector` against the container: less convenient than a testing
 * library's helpers, and it keeps the dependency list where it is.
 *
 * Everything a component does — an effect, a state update, an event handler —
 * must run inside `act`, or React warns and the assertion reads state from
 * before the update.
 */

export interface Rendered {
  container: HTMLElement;
  /** Re-render with new props. */
  update: (element: React.ReactElement) => void;
  /** Run something that updates state, then let React settle. */
  run: (work: () => void) => void;
  unmount: () => void;
  /** Every element matching, as an array rather than a NodeList. */
  all: (selector: string) => HTMLElement[];
  /** The text of every match, trimmed. */
  texts: (selector: string) => string[];
  one: (selector: string) => HTMLElement | null;
}

export const render = (element: React.ReactElement): Rendered => {
  // React only treats `act` as a test boundary when told it is in one; without
  // this it warns and lets updates escape the call, so an assertion reads the
  // state from before the event
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: Root;
  act(() => {
    root = createRoot(container);
    root.render(<ThemeProvider theme={theme}>{element}</ThemeProvider>);
  });

  const all = (selector: string) =>
    Array.from(container.querySelectorAll<HTMLElement>(selector));

  return {
    container,
    all,
    one: (selector: string) => container.querySelector<HTMLElement>(selector),
    texts: (selector: string) => all(selector).map((node) => node.textContent?.trim() || ""),
    update: (next: React.ReactElement) =>
      act(() => {
        root.render(<ThemeProvider theme={theme}>{next}</ThemeProvider>);
      }),
    run: (work: () => void) => act(work),
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
};

/**
 * A click React's synthetic handlers see.
 *
 * Bubbling, because React listens at the root rather than on the node, and
 * inside `act`, because a state update from a native event dispatched outside it
 * is never flushed — the assertion then reads the state from before the click.
 */
export const click = (node: Element | null) => {
  if (!node) {
    throw new Error("nothing to click");
  }
  act(() => {
    node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

/** A key press on a node, as React's onKeyDown receives it. */
export const press = (node: Element | null, key: string) => {
  if (!node) {
    throw new Error("nothing to press");
  }
  act(() => {
    node.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
};

/**
 * Text typed into a field, as React's onChange receives it.
 *
 * The value is set through the prototype's setter: React tracks the last value
 * it wrote on the node, and assigning `node.value` directly leaves that tracker
 * agreeing with the new value, so the change event is swallowed as a no-op.
 */
export const type = (node: Element | null, value: string) => {
  if (!node) {
    throw new Error("nothing to type into");
  }
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    setter?.call(node, value);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

/** A key press on the document, for handlers a component attaches to window. */
export const pressGlobally = (key: string) => {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
};
