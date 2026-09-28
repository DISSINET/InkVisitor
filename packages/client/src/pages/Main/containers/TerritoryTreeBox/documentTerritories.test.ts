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

let docCount = 0;
const doc = (T: string[]) => ({ id: `doc${++docCount}`, entityIds: { T } }) as never;
// a resource linked to each of the given documents
const linked = (...documents: { id: string }[]) =>
  documents.map((document) => ({ data: { documentId: document.id } }));
const marks = (documents: never[]) => getDocumentTerritoryIds(tree, documents, linked(...documents));

describe("getDocumentTerritoryIds", () => {
  it("keeps only the highest anchored territory of a document", () => {
    expect(marks([doc(["C", "A", "B"])])).toEqual(new Set(["A"]));
  });

  it("keeps one territory per document across separate branches", () => {
    expect(marks([doc(["B", "D"])])).toEqual(new Set(["D"]));
  });

  it("keeps the highest territory of each document", () => {
    expect(marks([doc(["A", "B"]), doc(["B", "C"])])).toEqual(
      new Set(["A", "B"]),
    );
  });

  it("ignores territories missing from the tree", () => {
    expect(marks([doc(["X"])]).size).toBe(0);
  });

  it("ignores documents no resource links to", () => {
    const linkedDocument = doc(["A"]);
    const unlinkedDocument = doc(["D"]);
    expect(
      getDocumentTerritoryIds(tree, [linkedDocument, unlinkedDocument], linked(linkedDocument)),
    ).toEqual(new Set(["A"]));
  });
});
