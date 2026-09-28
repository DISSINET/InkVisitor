import { IResponseTree } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { getTerritoryDocumentMarks } from "./territoryDocumentMarks";

const node = (id: string, path: string[], children: IResponseTree[] = []): IResponseTree =>
  ({ territory: { id }, path, children }) as unknown as IResponseTree;

// root > A > B > C, root > D
const tree = node("root", [], [
  node("A", ["root"], [node("B", ["root", "A"], [node("C", ["root", "A", "B"])])]),
  node("D", ["root"]),
]);

const doc = (T: string[]) => ({ entityIds: { T } }) as never;

describe("getTerritoryDocumentMarks", () => {
  it("marks the topmost anchored territory as document and the nested ones as anchor", () => {
    const marks = getTerritoryDocumentMarks(tree, [doc(["C", "A"])]);
    expect(marks.get("A")).toBe("document");
    expect(marks.get("C")).toBe("anchor");
    expect(marks.has("B")).toBe(false);
  });

  it("marks separate branches of one document each as document", () => {
    const marks = getTerritoryDocumentMarks(tree, [doc(["B", "D"])]);
    expect(marks.get("B")).toBe("document");
    expect(marks.get("D")).toBe("document");
  });

  it("keeps document when the territory is topmost in another document", () => {
    const marks = getTerritoryDocumentMarks(tree, [doc(["A", "B"]), doc(["B"])]);
    expect(marks.get("B")).toBe("document");
    const reversed = getTerritoryDocumentMarks(tree, [doc(["B"]), doc(["A", "B"])]);
    expect(reversed.get("B")).toBe("document");
  });

  it("ignores territories missing from the tree", () => {
    const marks = getTerritoryDocumentMarks(tree, [doc(["X"])]);
    expect(marks.size).toBe(0);
  });
});
