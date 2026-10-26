import { describe, expect, it } from "vitest";
import { batchAttributeChangeNote } from "./utils";

describe("batchAttributeChangeNote", () => {
  it("names how many entities already hold the target", () => {
    expect(batchAttributeChangeNote(3, false)).toEqual(" (3 already have that value)");
    expect(batchAttributeChangeNote(1, false)).toEqual(" (1 already has that value)");
  });

  it("notes the untouched rest", () => {
    expect(batchAttributeChangeNote(0, true)).toEqual(" (the rest stay untouched)");
  });

  it("joins both in one bracket", () => {
    expect(batchAttributeChangeNote(3, true)).toEqual(
      " (3 already have that value, the rest stay untouched)"
    );
  });

  it("is empty when neither applies", () => {
    expect(batchAttributeChangeNote(0, false)).toEqual("");
  });
});
