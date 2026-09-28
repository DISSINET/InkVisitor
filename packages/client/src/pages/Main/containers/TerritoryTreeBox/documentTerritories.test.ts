import { IResponseTree } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { getDocumentTerritoryIds } from "./documentTerritories";

const node = (id: string, path: string[], children: IResponseTree[] = []): IResponseTree =>
  ({ territory: { id }, path, lvl: path.length, children }) as unknown as IResponseTree;

// root > A > B > C, root > D
const tree = node("root", [], [
  node("A", ["root"], [node("B", ["root", "A"], [node("C", ["root", "A", "B"])])]),
  node("D", ["root"]),
]);

const doc = (T: string[]) => ({ entityIds: { T } }) as never;

describe("getDocumentTerritoryIds", () => {
  it("keeps only the highest anchored territory of a document", () => {
    expect(getDocumentTerritoryIds(tree, [doc(["C", "A", "B"])])).toEqual(new Set(["A"]));
  });

  it("keeps one territory per document across separate branches", () => {
    expect(getDocumentTerritoryIds(tree, [doc(["B", "D"])])).toEqual(new Set(["D"]));
  });

  it("keeps the highest territory of each document", () => {
    expect(getDocumentTerritoryIds(tree, [doc(["A", "B"]), doc(["B", "C"])])).toEqual(
      new Set(["A", "B"]),
    );
  });

  it("ignores territories missing from the tree", () => {
    expect(getDocumentTerritoryIds(tree, [doc(["X"])]).size).toBe(0);
  });
});
