import { describe, it, expect, beforeEach } from "vitest";
import reducer, { setAnnotatorBoxState } from "./annotatorBoxStateSlice";
import { AnnotatorBoxState } from "types";

describe("annotatorBoxStateSlice", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to Normal", () => {
    expect(reducer(undefined, { type: "@@INIT" } as any)).toBe(
      AnnotatorBoxState.Normal
    );
  });

  it("sets and persists FullHeight", () => {
    const next = reducer(
      AnnotatorBoxState.Normal,
      setAnnotatorBoxState(AnnotatorBoxState.FullHeight)
    );
    expect(next).toBe(AnnotatorBoxState.FullHeight);
    expect(localStorage.getItem("annotatorBoxState")).toBe(
      AnnotatorBoxState.FullHeight
    );
  });
});
