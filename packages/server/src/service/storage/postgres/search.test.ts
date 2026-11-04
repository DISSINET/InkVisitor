import { labelPattern } from "./search";

describe("labelPattern", () => {
  it("is the RethinkDB pattern with the word glue spelled out in ASCII", () => {
    expect(labelPattern("ab cd", "^", "$")).toBe(
      "(?i)(^|[^a-zA-Z0-9])[aàáâãäå]b([^a-zA-Z0-9]+[0-9A-Za-z_]+)*[^a-zA-Z0-9]+[cç]d($|[^a-zA-Z0-9])"
    );
    expect(labelPattern("ab cd", "", "")).toBe("(?i)[aàáâãäå]b([^a-zA-Z0-9]+[0-9A-Za-z_]+)*[^a-zA-Z0-9]+[cç]d");
    expect(labelPattern("Ab", "^", "")).toBe("(?i)(^|[^a-zA-Z0-9])[aàáâãäå]b");
  });
});
