import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { render, Rendered } from "../../utils/test/renderForTest";
import { HintLayer } from "./HintLayer";

/**
 * One document-level layer draws the hint of any element carrying `data-hint`.
 */

let view: Rendered | null = null;

afterEach(() => {
  view?.unmount();
  view = null;
});

const over = (node: Element, related: Element | null = null) =>
  act(() => {
    node.dispatchEvent(
      new PointerEvent("pointerover", { bubbles: true, relatedTarget: related }),
    );
  });
const out = (node: Element, related: Element | null = null) =>
  act(() => {
    node.dispatchEvent(
      new PointerEvent("pointerout", { bubbles: true, relatedTarget: related }),
    );
  });

const hintText = () =>
  Array.from(document.querySelectorAll("p"))
    .map((node) => node.textContent)
    .filter((text) => text === "first line" || text === "second line" || text === "other");

describe("HintLayer", () => {
  it("opens the hint of the element the pointer arrives on, one paragraph per line", () => {
    view = render(
      <>
        <HintLayer />
        <button data-hint={"first line\nsecond line"}>
          <span id="inner">go</span>
        </button>
      </>,
    );
    over(view.one("#inner")!);
    expect(hintText()).toEqual(["first line", "second line"]);
  });

  it("closes it when the pointer leaves, and keeps it while moving between children of the same element", () => {
    view = render(
      <>
        <HintLayer />
        <button data-hint="first line">
          <span id="a">a</span>
          <span id="b">b</span>
        </button>
      </>,
    );
    const a = view.one("#a")!;
    const b = view.one("#b")!;
    over(a);
    out(a, b);
    expect(hintText()).toEqual(["first line"]);
    out(b, document.body);
    expect(hintText()).toEqual([]);
  });

  it("draws nothing for an element with no hint, or an empty one", () => {
    view = render(
      <>
        <HintLayer />
        <button id="plain">plain</button>
        <button id="blank" data-hint="">
          blank
        </button>
      </>,
    );
    over(view.one("#plain")!);
    over(view.one("#blank")!);
    expect(hintText()).toEqual([]);
  });
});
