import { UserEnums } from "@inkvisitor/shared/enums";
import { IResponseTree } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { readBlockedTerritoryIds, rightTerritoryIds } from "./userTerritoryRights";

const node = (id: string, children: IResponseTree[] = []): IResponseTree =>
  ({
    territory: { id },
    path: [],
    statementsCount: 0,
    lvl: 0,
    children,
    right: UserEnums.RoleMode.Read,
  }) as unknown as IResponseTree;

const tree = node("root", [
  node("T1", [node("T1-1", [node("T1-1-1")]), node("T1-2")]),
  node("T2"),
]);

describe("rightTerritoryIds", () => {
  it("takes the territories of the asked mode only", () => {
    const rights = [
      { territory: "T1", mode: UserEnums.RoleMode.Read },
      { territory: "T2", mode: UserEnums.RoleMode.Write },
      { territory: "R1", mode: UserEnums.RoleMode.Annotate },
    ];

    expect(rightTerritoryIds(rights, UserEnums.RoleMode.Read)).toEqual(["T1"]);
    expect(rightTerritoryIds(rights, UserEnums.RoleMode.Write)).toEqual(["T2"]);
  });
});

describe("readBlockedTerritoryIds", () => {
  it("blocks a write territory with its whole subtree", () => {
    expect(readBlockedTerritoryIds(tree, ["T1"]).sort()).toEqual(
      ["T1", "T1-1", "T1-1-1", "T1-2"].sort(),
    );
  });

  it("blocks a leaf write territory alone", () => {
    expect(readBlockedTerritoryIds(tree, ["T2"])).toEqual(["T2"]);
  });

  it("keeps a write territory the tree does not carry", () => {
    expect(readBlockedTerritoryIds(tree, ["missing"])).toEqual(["missing"]);
    expect(readBlockedTerritoryIds(undefined, ["T1"])).toEqual(["T1"]);
  });

  it("blocks nothing without write rights", () => {
    expect(readBlockedTerritoryIds(tree, [])).toEqual([]);
  });
});
