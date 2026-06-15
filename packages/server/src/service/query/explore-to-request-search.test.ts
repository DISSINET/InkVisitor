import "ts-jest";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Explore } from "@inkvisitor/shared/types/query";
import { IRequestSearchRootValidity } from "@inkvisitor/shared/types/request-search";
import { exploreFiltersToRequestSearch } from "./explore-to-request-search";

describe("exploreFiltersToRequestSearch", () => {
  it("returns null when there are no translatable filters", () => {
    expect(exploreFiltersToRequestSearch([])).toBeNull();
    expect(
      exploreFiltersToRequestSearch([
        { type: Explore.SearchOption.Label, label: "x" },
        { type: Explore.SearchOption.UUIDs, ids: ["a"] },
        { type: Explore.SearchOption.RootValidity, rootValidity: IRequestSearchRootValidity.Valid },
      ])
    ).toBeNull();
  });

  it("maps status and language", () => {
    const req = exploreFiltersToRequestSearch([
      { type: Explore.SearchOption.Status, status: EntityEnums.Status.Approved },
      { type: Explore.SearchOption.Language, language: EntityEnums.Language.Latin },
    ]);
    expect(req).not.toBeNull();
    expect(req!.status).toBe(EntityEnums.Status.Approved);
    expect(req!.language).toBe(EntityEnums.Language.Latin);
  });

  it("maps created/updated dates from ISO strings to Date", () => {
    const iso = "2024-01-15T00:00:00.000Z";
    const req = exploreFiltersToRequestSearch([
      {
        type: Explore.SearchOption.CreatedAt,
        createdAfter: iso,
        createdBefore: "2024-01-16T00:00:00.000Z",
      },
      {
        type: Explore.SearchOption.UpdatedAt,
        updatedAfter: iso,
        updatedBefore: "2024-01-16T00:00:00.000Z",
      },
    ]);
    expect(req!.createdAfter).toEqual(new Date(iso));
    expect(req!.createdBefore).toEqual(new Date("2024-01-16T00:00:00.000Z"));
    expect(req!.updatedAfter).toEqual(new Date(iso));
    expect(req!.updatedBefore).toEqual(new Date("2024-01-16T00:00:00.000Z"));
  });

  it("maps created/updated/edited by", () => {
    const req = exploreFiltersToRequestSearch([
      { type: Explore.SearchOption.CreatedBy, createdBy: "u1" },
      { type: Explore.SearchOption.UpdatedBy, updatedBy: "u2" },
      { type: Explore.SearchOption.EditedBy, editedBy: "u3" },
    ]);
    expect(req!.createdBy).toBe("u1");
    expect(req!.updatedBy).toBe("u2");
    expect(req!.editedBy).toBe("u3");
  });

  it("ignores empty by-user / date values", () => {
    expect(
      exploreFiltersToRequestSearch([
        { type: Explore.SearchOption.CreatedBy, createdBy: "" },
        { type: Explore.SearchOption.CreatedAt, createdAfter: "", createdBefore: "" },
      ])
    ).toBeNull();
  });
});
