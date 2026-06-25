import { EntityEnums } from "@inkvisitor/shared/enums";
import { IDocument, IResponseEntity } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { resolveAnnotatorResourceId } from "./resolveAnnotatorResourceId";

const makeResource = (id: string, documentId?: string): IResponseEntity =>
  ({ id, data: { documentId } } as unknown as IResponseEntity);

const makeDocument = (id: string, territoryIds: string[]): IDocument =>
  ({
    id,
    entityIds: { [EntityEnums.Class.Territory]: territoryIds },
  } as unknown as IDocument);

describe("resolveAnnotatorResourceId", () => {
  it("resolves a resource whose document anchors the territory directly", () => {
    const resources = [makeResource("res-1", "doc-1")];
    const documents = [makeDocument("doc-1", ["T1"])];
    expect(resolveAnnotatorResourceId("T1", [], resources, documents)).toBe(
      "res-1"
    );
  });

  it("resolves a resource anchored on an ancestor in the territory path", () => {
    const resources = [makeResource("res-1", "doc-1")];
    const documents = [makeDocument("doc-1", ["Tparent"])];
    // path = [root, ...ancestors] (excludes the territory itself); the root at
    // index 0 is intentionally not consulted.
    expect(
      resolveAnnotatorResourceId("T2", ["Troot", "Tparent"], resources, documents)
    ).toBe("res-1");
  });

  it("returns false when no document anchors the territory or its ancestors", () => {
    const resources = [makeResource("res-1", "doc-1")];
    const documents = [makeDocument("doc-1", ["T1"])];
    expect(
      resolveAnnotatorResourceId("T2", ["Troot", "Tparent"], resources, documents)
    ).toBe(false);
  });

  it("ignores resources without a documentId", () => {
    const resources = [makeResource("res-1", undefined)];
    const documents = [makeDocument("doc-1", ["T1"])];
    expect(resolveAnnotatorResourceId("T1", [], resources, documents)).toBe(
      false
    );
  });

  it("prefers a direct anchor over an ancestor anchor", () => {
    const resources = [
      makeResource("res-ancestor", "doc-ancestor"),
      makeResource("res-direct", "doc-direct"),
    ];
    const documents = [
      makeDocument("doc-ancestor", ["Tparent"]),
      makeDocument("doc-direct", ["T2"]),
    ];
    expect(
      resolveAnnotatorResourceId("T2", ["Troot", "Tparent"], resources, documents)
    ).toBe("res-direct");
  });
});
