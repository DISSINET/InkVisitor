import { describe, it, expect } from "vitest";
import reducer, { setHoveredStatementId } from "./hoveredStatementIdSlice";

describe("hoveredStatementIdSlice", () => {
  it("defaults to null", () => {
    expect(reducer(undefined, { type: "@@INIT" } as any)).toBeNull();
  });

  it("sets a hovered statement id", () => {
    expect(reducer(null, setHoveredStatementId("st-1"))).toBe("st-1");
  });

  it("clears back to null", () => {
    expect(reducer("st-1", setHoveredStatementId(null))).toBeNull();
  });
});
