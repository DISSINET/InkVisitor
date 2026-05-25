import "ts-jest";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import {
  entityLabelMatchesFilter,
  entityMatchesRowLabelFilter,
  labelFilterToRegExp,
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

  const rowLabelFilter = (label: string): Explore.IExploreRowLabelFilter => ({
    type: Explore.EExploreFilterType.RowLabel,
    label,
  });

  it("labelFilterToRegExp supports wildcards", () => {
    expect(labelFilterToRegExp("*fruit*").test("Fruit Basket")).toBeTruthy();
    expect(labelFilterToRegExp("basket").test("Fruit Basket")).toBeTruthy();
    expect(labelFilterToRegExp("basket").test("Alt label")).toBeFalsy();
  });

  it("entityLabelMatchesFilter checks any entity labels entry", () => {
    expect(entityLabelMatchesFilter(entity.labels, "alt")).toBeTruthy();
    expect(entityLabelMatchesFilter(entity.labels, "missing")).toBeFalsy();
  });

  it("entityLabelMatchesFilter matches multi-word names", () => {
    const labels = ["Fruit Basket", "Evelín Teměř Jr.", "John Smith"];
    expect(entityLabelMatchesFilter(labels, "fruit basket")).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, "John Smith")).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, "Evelín Teměř")).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, "evelin temer")).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, "Teměř Jr")).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, "Smith John")).toBeFalsy();
  });

  it("entityLabelMatchesFilter matches when the second word is only partially typed", () => {
    const labels = ["John Smith", "Evelín Teměř Jr."];
    expect(entityLabelMatchesFilter(labels, "John Sm")).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, "John S")).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, "Evelín Tem")).toBeTruthy();
    expect(entityLabelMatchesFilter(labels, "John Smithson")).toBeFalsy();
  });

  it("entityMatchesRowLabelFilter matches against entity.labels attribute", () => {
    expect(entityMatchesRowLabelFilter(entity, rowLabelFilter("*fruit*"))).toBeTruthy();
    expect(entityMatchesRowLabelFilter(entity, rowLabelFilter("missing"))).toBeFalsy();
    expect(entityMatchesRowLabelFilter(entity, rowLabelFilter(""))).toBeTruthy();
  });
});
