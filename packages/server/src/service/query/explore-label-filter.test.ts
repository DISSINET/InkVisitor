import "ts-jest";
import { entityLabelMatchesRegex, parseUserRegex } from "./explore-label-filter";

describe("explore-label-filter", () => {
  it("parseUserRegex supports literal and raw patterns", () => {
    expect(parseUserRegex("^John")?.test("John Smith")).toBeTruthy();
    expect(parseUserRegex("/smith$/i")?.test("John Smith")).toBeTruthy();
    expect(parseUserRegex("(")).toBeNull();
  });

  it("entityLabelMatchesRegex checks every label", () => {
    const labels = ["John Smith", "Fruit Basket", "Alt label"];
    expect(entityLabelMatchesRegex(labels, "^John")).toBeTruthy();
    expect(entityLabelMatchesRegex(labels, "Basket$")).toBeTruthy();
    expect(entityLabelMatchesRegex(labels, "/^Alt/")).toBeTruthy();
    expect(entityLabelMatchesRegex(labels, "^Smith")).toBeFalsy();
    expect(entityLabelMatchesRegex(labels, "(unclosed")).toBeFalsy();
  });
});
