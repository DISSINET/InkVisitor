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
