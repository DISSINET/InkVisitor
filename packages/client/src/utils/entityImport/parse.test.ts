import { parseImportInput } from "./parse";

describe("parseImportInput", () => {
  it("rejects empty input", () => {
    const { items, errors } = parseImportInput("   ", 10);
    expect(items).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it("reports invalid JSON with the parser message", () => {
    const { errors } = parseImportInput("{ labels: ", 10);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/^Invalid JSON: /);
  });

  it("accepts trailing commas and keeps commas inside texts", () => {
    const text = '[{"class": "C", "labels": ["a,]", "b\\",}",], },\n]';
    const { items, errors } = parseImportInput(text, 10);
    expect(errors).toEqual([]);
    expect(items).toEqual([{ class: "C", labels: ["a,]", 'b",}'] }]);
  });

  it("wraps a single object into a list", () => {
    const { items, errors } = parseImportInput('{"class": "C"}', 10);
    expect(errors).toEqual([]);
    expect(items).toEqual([{ class: "C" }]);
  });

  it("accepts an array of objects", () => {
    const { items, errors } = parseImportInput('[{"class": "C"}, {"class": "P"}]', 10);
    expect(errors).toEqual([]);
    expect(items).toHaveLength(2);
  });

  it("rejects an empty array", () => {
    expect(parseImportInput("[]", 10).errors).toHaveLength(1);
  });

  it("rejects more than 10 entities", () => {
    const text = JSON.stringify(Array.from({ length: 11 }, () => ({ class: "C" })));
    const { errors } = parseImportInput(text, 10);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("11");
  });

  it("flags every item that is not an object", () => {
    const { errors } = parseImportInput('[{"class": "C"}, "dog", [1]]', 10);
    expect(errors.map((error) => error.entityIndex)).toEqual([2, 3]);
  });
});
