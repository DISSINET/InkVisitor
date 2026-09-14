import { RelationEnums } from "@inkvisitor/shared/enums";
import { Explore } from "@inkvisitor/shared/types/query";
import { describe, expect, it } from "vitest";
import { isReadOnlyColumn } from "./types";

describe("isReadOnlyColumn", () => {
  it("a forward relation column can be edited", () => {
    expect(
      isReadOnlyColumn({
        type: Explore.EExploreColumnType.ER,
        params: { relationType: RelationEnums.Type.Superclass },
      }),
    ).toBe(false);
  });

  it("an inverse relation column is read-only", () => {
    expect(
      isReadOnlyColumn({
        type: Explore.EExploreColumnType.ER,
        params: { relationType: RelationEnums.Type.Superclass, inverse: true },
      }),
    ).toBe(true);
  });

  it("read-only column types stay read-only", () => {
    expect(isReadOnlyColumn({ type: Explore.EExploreColumnType.ECL, params: {} })).toBe(true);
  });
});
