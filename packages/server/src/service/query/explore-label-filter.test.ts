import "ts-jest";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import {
  entityLabelMatchesFilter,
  entityMatchesRowLabelFilter,
  labelFilterToRegExp,
  parseUserRegex,
} from "./explore-label-filter";

describe("explore-label-filter", () => {
  const entity: IEntity = {
    id: "test-entity",
    class: EntityEnums.Class.Concept,
    labels: ["Fruit Basket", "Alt label"],
    data: {},
    props: [],
    references: [],
    detail: "",
    language: EntityEnums.Language.English,
    notes: [],
    status: EntityEnums.Status.Approved,
  };

  const rowLabelFilter = (
    label: string,
    useRegex?: boolean
  ): Explore.IExploreRowLabelFilter => ({
    type: Explore.EExploreFilterType.RowLabel,
    label,
    useRegex,
  });

  const labelFilter = (label: string) => ({ label, useRegex: false as const });

  it("labelFilterToRegExp supports wildcards", () => {
    expect(labelFilterToRegExp("*fruit*").test("Fruit Basket")).toBeTruthy();
    expect(labelFilterToRegExp("basket").test("Fruit Basket")).toBeTruthy();
    expect(labelFilterToRegExp("basket").test("Alt label")).toBeFalsy();
  });

  it("entityLabelMatchesFilter checks any entity labels entry", () => {
    expect(entityLabelMatchesFilter(entity.labels, labelFilter("alt"))).toBeTruthy();
    expect(entityLabelMatchesFilter(entity.labels, labelFilter("missing"))).toBeFalsy();
  });

  it("entityLabelMatchesFilter matches multi-word names", () => {
    const labels = ["Fruit Basket", "Evelín Teměř Jr.", "John Smith"];
    expect(entityLabelMatchesFilter(labels, labelFilter("fruit basket"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("John Smith"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("Evelín Teměř"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("evelin temer"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("Teměř Jr"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("Smith John"))).toBeFalsy();
  });

  it("entityLabelMatchesFilter matches when the second word is only partially typed", () => {
    const labels = ["John Smith", "Evelín Teměř Jr."];
    expect(entityLabelMatchesFilter(labels, labelFilter("John Sm"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("John S"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("Evelín Tem"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("John Smithson"))).toBeFalsy();
  });

  it("entityLabelMatchesFilter matches substrings not only from word start", () => {
    const labels = ["John Smith", "Fruit Basket"];
    expect(entityLabelMatchesFilter(labels, labelFilter("mith"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("smith"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("asket"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("ohn"))).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, labelFilter("xyz"))).toBeFalsy();
  });

  it("parseUserRegex supports literal and raw patterns", () => {
    expect(parseUserRegex("^John")?.test("John Smith")).toBeTruthy();
    expect(parseUserRegex("/smith$/i")?.test("John Smith")).toBeTruthy();
    expect(parseUserRegex("(")).toBeNull();
  });

  it("entityLabelMatchesFilter supports regex mode", () => {
    const labels = ["John Smith", "Fruit Basket", "Alt label"];
    expect(
      entityLabelMatchesFilter(labels, { label: "^John", useRegex: true })
    ).toBeTruthy();
    expect(
      entityLabelMatchesFilter(labels, { label: "Basket$", useRegex: true })
    ).toBeTruthy();
    expect(
      entityLabelMatchesFilter(labels, { label: "/^Alt/", useRegex: true })
    ).toBeTruthy();
    expect(
      entityLabelMatchesFilter(labels, { label: "^Smith", useRegex: true })
    ).toBeFalsy();
    expect(
      entityLabelMatchesFilter(labels, { label: "(unclosed", useRegex: true })
    ).toBeFalsy();
  });

  it("entityMatchesRowLabelFilter matches against entity.labels attribute", () => {
    expect(entityMatchesRowLabelFilter(entity, rowLabelFilter("*fruit*"))).toBeTruthy();
    expect(entityMatchesRowLabelFilter(entity, rowLabelFilter("missing"))).toBeFalsy();
    expect(entityMatchesRowLabelFilter(entity, rowLabelFilter(""))).toBeTruthy();
    expect(
      entityMatchesRowLabelFilter(entity, rowLabelFilter("^Fruit", true))
    ).toBeTruthy();
  });
});
