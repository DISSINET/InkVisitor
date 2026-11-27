import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { render, Rendered } from "../../utils/test/renderForTest";
import { CandidateScopeMark } from "./CandidateScopeMark";

let view: Rendered | null = null;
afterEach(() => {
  view?.unmount();
  view = null;
  document.body.innerHTML = "";
});

describe("CandidateScopeMark", () => {
  it("says a name form names the town or area around the place, and why that matters", () => {
    view = render(<CandidateScopeMark scope="container" />);
    const mark = document.querySelector<HTMLElement>("[data-hint]")!;
    expect(mark.textContent).toBe("around it");
    expect(mark.dataset.hint).toContain("only where nothing else was found");
  });

  it("says nothing for a name of the place itself, or where the engine marked nothing", () => {
    view = render(
      <>
        <CandidateScopeMark scope="place" />
        <CandidateScopeMark />
      </>,
    );
    expect(document.body.textContent).toBe("");
  });
});
