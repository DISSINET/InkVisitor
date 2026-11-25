import { clean } from "@modules/common.test";
import { apiPath } from "@common/constants";
import { getAuthenticatedAgent } from "../../test/testAuth";
import { Db } from "@service/storage";
import Document from "@models/document/document";
import Entity from "@models/entity/entity";
import { pool } from "@middlewares/db";

// document tag names exclude ".", so anchored ids stay dot-free
const tagSafeId = () => Math.random().toString().replace(/\./g, "");

describe("modules/documents remove anchors", function () {
  const db = new Db();
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  // one entity per route, so neither route's document shows up in the other's usedInDocuments
  const removedOne = new Entity({ id: tagSafeId() });
  const removedAll = new Entity({ id: tagSafeId() });
  const kept = new Entity({ id: tagSafeId() });

  const storedAndRebuilt = async (documentId: string) => {
    const stored = await Document.getDocumentById(db.connection, documentId);
    const rebuilt = new Document({ ...stored });
    await rebuilt.preprocess(db.connection);
    // a loaded tree carries no text offsets, so the rebuilt one is compared as it reads back
    return {
      stored: stored?.anchors,
      rebuilt: new Document({ anchors: rebuilt.anchors }).anchors,
    };
  };

  const saveDocument = async (content: string) => {
    const document = new Document({ title: "doc", content });
    await document.preprocess(db.connection);
    await document.save(db.connection);
    return document;
  };

  beforeAll(async () => {
    await db.initDb();
    await removedOne.save(db.connection);
    await removedAll.save(db.connection);
    await kept.save(db.connection);
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await clean(db);
    await pool.end();
  });

  describe("PATCH /:documentId/removeAnchor", () => {
    let document: Document;

    beforeAll(async () => {
      const e = removedOne.id;
      document = await saveDocument(`<${e}>one</${e}> <${e}>two</${e}> <${e}>three</${e}>`);
      await authAgent
        .patch(`${apiPath}/documents/${document.id}/removeAnchor`)
        .send({ entityId: e, anchorIndex: 0 })
        .expect(200);
    });

    it("stores the anchor tree of the new content", async () => {
      const { stored, rebuilt } = await storedAndRebuilt(document.id);
      expect(stored).toEqual(rebuilt);
    });

    it("lists only the remaining anchors in usedInDocuments", async () => {
      const used = await removedOne.findUsedInDocuments(db.connection);
      expect(used.map((u) => [u.anchorText, u.anchorIndex])).toEqual([
        ["two", 0],
        ["three", 1],
      ]);
    });
  });

  describe("PATCH /:documentId/removeAnchors", () => {
    let document: Document;

    beforeAll(async () => {
      document = await saveDocument(
        `<${removedAll.id}>one</${removedAll.id}> <${kept.id}>two</${kept.id}>`
      );
      await authAgent
        .patch(`${apiPath}/documents/${document.id}/removeAnchors`)
        .query({ entityIds: removedAll.id })
        .expect(200);
    });

    it("stores the anchor tree of the new content", async () => {
      const { stored, rebuilt } = await storedAndRebuilt(document.id);
      expect(stored).toEqual(rebuilt);
    });

    it("drops the removed entity from usedInDocuments", async () => {
      const used = await removedAll.findUsedInDocuments(db.connection);
      expect(used).toEqual([]);
    });
  });
});
