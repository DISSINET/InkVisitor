import { jsonErrorOffset, parseImportInput } from "./parse";

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

  it("reads the entities of an Explorer JSON export", () => {
    const text = JSON.stringify({
      exportedAt: "2026-11-22T10:00:00Z",
      version: "1.7.0",
      query: { type: "e" },
      entities: [{ class: "C", labels: ["dog"] }],
      audits: [{ id: "a1" }],
    });
    const { items, errors } = parseImportInput(text, 10);
    expect(errors).toEqual([]);
    expect(items).toEqual([{ class: "C", labels: ["dog"] }]);
  });

  it("finds where the JSON broke from the parser message", () => {
    const text = '[\n  {"a": 1}\n  {"b": 2}\n]';
    // Chrome
    expect(jsonErrorOffset("Expected ',' or ']' at position 15 (line 3 column 3)", text)).toBe(15);
    // Firefox
    expect(jsonErrorOffset("expected ',' at line 3 column 3 of the JSON data", text)).toBe(15);
    // Safari
    expect(jsonErrorOffset("JSON Parse error: Expected ']'", text)).toBeUndefined();
  });

  it("finds an unexpected token from the text Chrome quotes around it", () => {
    const offsetOf = (text: string) => {
      try {
        JSON.parse(text);
      } catch (error) {
        return jsonErrorOffset((error as Error).message, text);
      }
    };
    const numbers = Array.from({ length: 12 }, (_, index) => index + 1).join(", ");
    // cut on both sides
    const middle = `[${numbers}, @, ${numbers}]`;
    expect(offsetOf(middle)).toBe(middle.indexOf("@"));
    // cut after only
    const start = `@[${numbers}]`;
    expect(offsetOf(start)).toBe(0);
    // cut before only
    const end = `[${numbers}, @]`;
    expect(offsetOf(end)).toBe(end.indexOf("@"));
    // the whole text quoted
    expect(offsetOf('{"a": x}')).toBeUndefined();
    // the text ends early
    expect(offsetOf(`[${numbers},`)).toBe(`[${numbers},`.length);
  });

  it("reports the error past an accepted trailing comma", () => {
    const text = '[\n  {"a": 1,},\n  {"b": 2}\n  {"c": 3}\n]';
    const { errors } = parseImportInput(text, 10);
    expect(errors).toHaveLength(1);
    expect(errors[0].offset).toBe(text.indexOf('{"c"'));
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

  it("leaves the uncounted items out of the limit", () => {
    const items = [
      ...Array.from({ length: 10 }, () => ({ class: "C" })),
      { id: "copy", class: "V" },
    ];
    const { errors } = parseImportInput(JSON.stringify(items), 10, new Set(["copy"]));
    expect(errors).toEqual([]);
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
