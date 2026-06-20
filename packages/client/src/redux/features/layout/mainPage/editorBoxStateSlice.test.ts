import { describe, it, expect, beforeEach } from "vitest";
import reducer, { setEditorBoxState } from "./editorBoxStateSlice";
import { EditorBoxState } from "types";

describe("editorBoxStateSlice", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to Normal", () => {
    expect(reducer(undefined, { type: "@@INIT" } as any)).toBe(
      EditorBoxState.Normal
    );
  });

  it("sets and persists FullHeight", () => {
    const next = reducer(
      EditorBoxState.Normal,
      setEditorBoxState(EditorBoxState.FullHeight)
    );
    expect(next).toBe(EditorBoxState.FullHeight);
    expect(localStorage.getItem("editorBoxState")).toBe(
      EditorBoxState.FullHeight
    );
  });
});
