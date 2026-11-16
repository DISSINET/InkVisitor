import { EntityEnums } from "@inkvisitor/shared/enums";
import { Explore } from "@inkvisitor/shared/types/query";
import { describe, expect, it } from "vitest";
import { ExploreActionType, exploreReducer, exploreStateInitial } from "./state";

const column = (id: string, name: string): Explore.IExploreColumn => ({
  id,
  name,
  type: Explore.EExploreColumnType.EST,
  editable: true,
  params: {},
});

describe("exploreReducer setColumns", () => {
  it("replaces the table columns, keeping their names and order", () => {
    const state: Explore.IExplore = {
      ...exploreStateInitial,
      view: { mode: Explore.EViewMode.Table, columns: [column("a", "old")] },
    };
    const columns = [column("c", "third"), column("b", "second")];

    const next = exploreReducer(state, {
      type: ExploreActionType.setColumns,
      payload: { columns },
    });

    expect(next.view).toEqual({ mode: Explore.EViewMode.Table, columns });
  });

  it("leaves the Stats view untouched", () => {
    const state: Explore.IExplore = {
      ...exploreStateInitial,
      view: {
        mode: Explore.EViewMode.Stats,
        stats: {} as Explore.IExploreStatsParams,
      },
    };

    const next = exploreReducer(state, {
      type: ExploreActionType.setColumns,
      payload: { columns: [column("a", "a")] },
    });

    expect(next).toBe(state);
  });
});

describe("exploreReducer setAttributeFilter", () => {
  const status = Explore.SearchOption.Status;

  it("replaces the filter of its type and drops it once its list is empty", () => {
    const withOld: Explore.IExplore = {
      ...exploreStateInitial,
      filters: [{ type: status, status: "1" as EntityEnums.Status }],
    };
    const statuses = ["0", "2"] as EntityEnums.Status[];

    const next = exploreReducer(withOld, {
      type: ExploreActionType.setAttributeFilter,
      payload: { type: status, statuses },
    });
    expect(next.filters).toEqual([{ type: status, statuses }]);

    const cleared = exploreReducer(next, {
      type: ExploreActionType.setAttributeFilter,
      payload: { type: status, statuses: [] },
    });
    expect(cleared.filters).toEqual([]);
  });
});

describe("Explore.attributeFilterParams", () => {
  it("reads the lists, and the single value of a filter saved before them", () => {
    expect(
      Explore.attributeFilterParams([
        { type: Explore.SearchOption.Status, status: "1" as EntityEnums.Status },
        { type: Explore.SearchOption.Language, language: "" as EntityEnums.Language },
        { type: Explore.SearchOption.LogicalType, logicalTypes: [] },
        {
          type: Explore.SearchOption.PartOfSpeech,
          partsOfSpeech: ["noun" as EntityEnums.ConceptPartOfSpeech],
        },
        { type: Explore.SearchOption.Label, label: "x" },
      ]),
    ).toEqual({
      entityStatuses: ["1"],
      entityLanguages: [""],
      entityPartsOfSpeech: ["noun"],
    });
  });
});
