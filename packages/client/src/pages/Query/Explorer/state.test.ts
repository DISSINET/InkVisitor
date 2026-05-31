import { Explore } from "@inkvisitor/shared/types/query";
import { IRequestSearchRootValidity } from "@inkvisitor/shared/types/request-search";
import { describe, expect, it } from "vitest";
import { ExploreActionType, exploreReducer, exploreStateInitial } from "./state";

const findFilter = (
  state: Explore.IExplore,
  type: Explore.SearchOption
): Explore.IExploreSearchFilter | undefined =>
  state.filters.find((f) => f.type === type);

describe("exploreReducer - migrated search filters", () => {
  it("setCreatedAtFilter stores ISO string from the createdDate payload", () => {
    const date = new Date("2024-01-15T00:00:00.000Z");
    const next = exploreReducer(exploreStateInitial, {
      type: ExploreActionType.setCreatedAtFilter,
      payload: { createdDate: date },
    });
    const filter = findFilter(next, Explore.SearchOption.CreatedAt);
    expect(filter).toEqual({
      type: Explore.SearchOption.CreatedAt,
      createdAt: date.toISOString(),
    });
  });

  it("setCreatedAtFilter clears the filter when date is undefined", () => {
    const withFilter = exploreReducer(exploreStateInitial, {
      type: ExploreActionType.setCreatedAtFilter,
      payload: { createdDate: new Date("2024-01-15T00:00:00.000Z") },
    });
    const cleared = exploreReducer(withFilter, {
      type: ExploreActionType.setCreatedAtFilter,
      payload: { createdDate: undefined },
    });
    expect(findFilter(cleared, Explore.SearchOption.CreatedAt)).toBeUndefined();
  });

  it("setUpdatedAtFilter stores ISO string from the updatedDate payload", () => {
    const date = new Date("2024-02-20T00:00:00.000Z");
    const next = exploreReducer(exploreStateInitial, {
      type: ExploreActionType.setUpdatedAtFilter,
      payload: { updatedDate: date },
    });
    expect(findFilter(next, Explore.SearchOption.UpdatedAt)).toEqual({
      type: Explore.SearchOption.UpdatedAt,
      updatedAt: date.toISOString(),
    });
  });

  it("setCreatedByFilter clears when value is empty", () => {
    const withFilter = exploreReducer(exploreStateInitial, {
      type: ExploreActionType.setCreatedByFilter,
      payload: { createdBy: "u1" },
    });
    expect(findFilter(withFilter, Explore.SearchOption.CreatedBy)).toEqual({
      type: Explore.SearchOption.CreatedBy,
      createdBy: "u1",
    });
    const cleared = exploreReducer(withFilter, {
      type: ExploreActionType.setCreatedByFilter,
      payload: { createdBy: undefined },
    });
    expect(findFilter(cleared, Explore.SearchOption.CreatedBy)).toBeUndefined();
  });

  it("setEditedByFilter adds and clears the edited-by filter", () => {
    const withFilter = exploreReducer(exploreStateInitial, {
      type: ExploreActionType.setEditedByFilter,
      payload: { editedBy: "u3" },
    });
    expect(findFilter(withFilter, Explore.SearchOption.EditedBy)).toEqual({
      type: Explore.SearchOption.EditedBy,
      editedBy: "u3",
    });
    const cleared = exploreReducer(withFilter, {
      type: ExploreActionType.setEditedByFilter,
      payload: { editedBy: undefined },
    });
    expect(findFilter(cleared, Explore.SearchOption.EditedBy)).toBeUndefined();
  });

  it("setRootValidityFilter adds Valid/Invalid and clears on Any", () => {
    const valid = exploreReducer(exploreStateInitial, {
      type: ExploreActionType.setRootValidityFilter,
      payload: { rootValidity: IRequestSearchRootValidity.Valid },
    });
    expect(findFilter(valid, Explore.SearchOption.RootValidity)).toEqual({
      type: Explore.SearchOption.RootValidity,
      rootValidity: IRequestSearchRootValidity.Valid,
    });
    const cleared = exploreReducer(valid, {
      type: ExploreActionType.setRootValidityFilter,
      payload: { rootValidity: IRequestSearchRootValidity.Any },
    });
    expect(findFilter(cleared, Explore.SearchOption.RootValidity)).toBeUndefined();
  });
});
