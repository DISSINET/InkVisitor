import { describe, it, expect } from "vitest";
import reducer, { setSelectedResourceId } from "./selectedResourceIdSlice";

describe("selectedResourceIdSlice", () => {
  it("defaults to false", () => {
    expect(reducer(undefined, { type: "@@INIT" } as any)).toBe(false);
  });

  it("sets a resource id", () => {
    expect(reducer(false, setSelectedResourceId("res-1"))).toBe("res-1");
  });

  it("clears back to false", () => {
    expect(reducer("res-1", setSelectedResourceId(false))).toBe(false);
  });
});
