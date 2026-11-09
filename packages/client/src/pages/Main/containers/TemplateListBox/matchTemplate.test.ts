import { IEntity } from "@inkvisitor/shared/types";
import { templateMatcher } from "./matchTemplate";

const template = (id: string, labels: string[]): IEntity => ({ id, labels }) as unknown as IEntity;

const matches = (search: string, t: IEntity) => templateMatcher(search)?.(t) ?? true;

describe("templateMatcher", () => {
  const witness = template("c0ffee12-3456", ["Statement of a witness", "testimony (oral)"]);

  it("passes every template when nothing is typed", () => {
    expect(templateMatcher("  ")).toBeUndefined();
    expect(templateMatcher("*")).toBeUndefined();
  });

  it("matches the start of any word of the label", () => {
    expect(matches("state", witness)).toBe(true);
    expect(matches("witn", witness)).toBe(true);
    expect(matches("WITNESS", witness)).toBe(true);
  });

  it("does not match inside a word unless the search starts with *", () => {
    expect(matches("itness", witness)).toBe(false);
    expect(matches("*itness", witness)).toBe(true);
  });

  it("matches typed words in order with other words between them", () => {
    expect(matches("statement witness", witness)).toBe(true);
    expect(matches("witness statement", witness)).toBe(false);
  });

  it("fails fast on a long label of separators", () => {
    const t = template("1", [`a ${"_a".repeat(5000)}`]);
    expect(matches("a b", t)).toBe(false);
  });

  it("matches alternative labels", () => {
    expect(matches("testim", witness)).toBe(true);
    expect(matches("oral", witness)).toBe(true);
  });

  it("matches regex characters literally", () => {
    expect(matches("(oral", witness)).toBe(true);
    expect(matches("o.al", witness)).toBe(false);
  });

  it("ignores accents on either side", () => {
    const t = template("1", ["Volapük grammar"]);
    expect(matches("volapuk", t)).toBe(true);
    expect(matches("volapük", template("2", ["Volapuk"]))).toBe(true);
  });

  it("matches a UUID prefix", () => {
    expect(matches("c0ffee", witness)).toBe(true);
    expect(matches("ffee12", witness)).toBe(false);
  });
});
