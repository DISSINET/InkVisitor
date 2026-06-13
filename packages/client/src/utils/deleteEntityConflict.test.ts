import { IInvalidDeleteErrorData } from "@inkvisitor/shared/types/errors";
import {
  getInvalidDeleteErrorData,
  resolveDeleteEntityConflict,
} from "./deleteEntityConflict";

const deletedEntityId = "entity-being-deleted";

describe("getInvalidDeleteErrorData", () => {
  it("returns the typed data for a valid InvalidDeleteError", () => {
    const error = {
      error: "InvalidDeleteError",
      message: "nope",
      data: { type: "document", ids: ["doc-1"] } as IInvalidDeleteErrorData,
    };
    expect(getInvalidDeleteErrorData(error)).toEqual({
      type: "document",
      ids: ["doc-1"],
    });
  });

  it("returns null for a different error", () => {
    expect(
      getInvalidDeleteErrorData({ error: "SomethingElse", data: { type: "entity", ids: ["e"] } })
    ).toBeNull();
  });

  it("returns null when data is missing or has no ids", () => {
    expect(getInvalidDeleteErrorData({ error: "InvalidDeleteError" })).toBeNull();
    expect(
      getInvalidDeleteErrorData({ error: "InvalidDeleteError", data: { type: "entity", ids: [] } })
    ).toBeNull();
  });

  it("returns null for null/undefined/non-object input", () => {
    expect(getInvalidDeleteErrorData(null)).toBeNull();
    expect(getInvalidDeleteErrorData(undefined)).toBeNull();
    expect(getInvalidDeleteErrorData("oops")).toBeNull();
  });
});

describe("resolveDeleteEntityConflict", () => {
  it("opens the first conflicting entity for an entity conflict", () => {
    const data: IInvalidDeleteErrorData = {
      type: "entity",
      ids: ["other-entity-1", "other-entity-2"],
    };
    const result = resolveDeleteEntityConflict(data, deletedEntityId);
    expect(result.targetId).toBe("other-entity-1");
    expect(result.message.toLowerCase()).toContain("entity");
  });

  it("opens the entity being deleted (not the document) for a document conflict", () => {
    const data: IInvalidDeleteErrorData = {
      type: "document",
      ids: ["doc-1", "doc-2"],
    };
    const result = resolveDeleteEntityConflict(data, deletedEntityId);
    // must NOT navigate to a document id - documents are not entities
    expect(result.targetId).toBe(deletedEntityId);
    expect(result.targetId).not.toBe("doc-1");
    expect(result.message.toLowerCase()).toContain("document");
  });

  it("uses singular wording for a single document", () => {
    const result = resolveDeleteEntityConflict(
      { type: "document", ids: ["doc-1"] },
      deletedEntityId
    );
    expect(result.message).toContain("1 document");
    expect(result.message).not.toContain("documents");
  });

  it("uses plural wording for multiple documents", () => {
    const result = resolveDeleteEntityConflict(
      { type: "document", ids: ["doc-1", "doc-2", "doc-3"] },
      deletedEntityId
    );
    expect(result.message).toContain("3 documents");
  });
});
