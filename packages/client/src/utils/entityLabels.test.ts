import { isDuplicateLabel } from "./entityLabels";

describe("isDuplicateLabel", () => {
  const labels = ["main", "alt one", "alt two"];

  it("detects a label that is already present", () => {
    expect(isDuplicateLabel(labels, "alt two")).toBe(true);
    expect(isDuplicateLabel(labels, "main")).toBe(true);
  });

  it("accepts a new label", () => {
    expect(isDuplicateLabel(labels, "alt three")).toBe(false);
  });

  it("ignores surrounding whitespace", () => {
    expect(isDuplicateLabel(labels, " alt one ")).toBe(true);
    expect(isDuplicateLabel(["main", "alt "], "alt")).toBe(true);
  });

  it("is case sensitive", () => {
    expect(isDuplicateLabel(labels, "Alt One")).toBe(false);
  });

  it("skips the label being edited", () => {
    expect(isDuplicateLabel(labels, "alt one", 1)).toBe(false);
    expect(isDuplicateLabel(labels, "alt two", 1)).toBe(true);
  });
});
