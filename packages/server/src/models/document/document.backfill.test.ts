import "ts-jest";
import { Db } from "@service/rethink";
import { clean } from "@modules/common.test";
import { EntityEnums } from "@inkvisitor/shared/enums";
import Entity from "@models/entity/entity";
import Document from "./document";

describe("Document.backfillEntityIds", function () {
  const db = new Db();
  // document tag names exclude ".", so the anchored id stays dot-free
  const anchored = new Entity({ id: Math.random().toString().replace(/\./g, "") });
  const plain = new Document({ content: "text without anchors" });
  const withAnchor = new Document({ content: `a <${anchored.id}>span</${anchored.id}> b` });
  let backfilled = 0;

  beforeAll(async () => {
    await db.initDb();
    await anchored.save(db.connection);
    await plain.save(db.connection);
    await withAnchor.save(db.connection);
    backfilled = await Document.backfillEntityIds(db.connection);
  });

  afterAll(async () => {
    await clean(db);
  });

  test("does not save a document without anchors", async () => {
    const stored = await Document.getDocumentById(db.connection, plain.id);
    expect(stored?.updatedAt).toBeUndefined();
  });

  test("fills entityIds of a document with anchors", async () => {
    const stored = await Document.getDocumentById(db.connection, withAnchor.id);
    expect(stored?.entityIds[EntityEnums.Class.Person]).toEqual([anchored.id]);
  });

  test("counts only the documents it saved", () => {
    expect(backfilled).toBe(1);
  });
});
