import "ts-jest";
import { Db } from "@service/rethink";
import { clean, newMockRequest } from "@modules/common.test";
import { prepareEntity } from "@models/entity/entity.test";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { prepareRelation } from "@models/relation/relation.test";
import Document from "./document";

describe("test Document.findByEntityId", function () {
  const db = new Db();
  const [, docEntity1] = prepareEntity();
  const [, docEntity2] = prepareEntity();
  const [, entity3] = prepareEntity();

  const document1: Document = new Document({
    content: "content1",
    createdAt: new Date(),
  });

  const document2: Document = new Document({
    content: "content1",
    createdAt: new Date(),
  });

  beforeAll(async () => {
    await db.initDb();
    await docEntity1.save(db.connection);
    await docEntity2.save(db.connection);
    await entity3.save(db.connection);
    // force ids
    document1.entityIds = [docEntity1.id, docEntity2.id];
    await document1.save(db.connection);
    // force ids
    document2.entityIds = [docEntity1.id];
    await document2.save(db.connection);
  });

  afterAll(async () => {
    await clean(db);
  });

  test("nonexisting document id", async () => {
    const shouldBeEmptyArr = await Document.findByEntityId(
      db.connection,
      Math.random().toFixed()
    );
    expect(shouldBeEmptyArr).toHaveLength(0);
  });

  test("prepared linked entity 1", async () => {
    const shouldFindDocs = await Document.findByEntityId(
      db.connection,
      docEntity1.id
    );
    expect(
      shouldFindDocs.find((found) => found.id === document1.id)
    ).toBeTruthy();
    expect(
      shouldFindDocs.find((found) => found.id === document2.id)
    ).toBeTruthy();
  });

  test("prepared linked entity 2", async () => {
    const shouldFindDocs = await Document.findByEntityId(
      db.connection,
      docEntity2.id
    );
    expect(
      shouldFindDocs.find((found) => found.id === document1.id)
    ).toBeTruthy();
    expect(
      shouldFindDocs.find((found) => found.id === document2.id)
    ).toBeFalsy();
  });

  test("prepared linked entity 2", async () => {
    const shouldFindDocs = await Document.findByEntityId(
      db.connection,
      entity3.id
    );
    expect(shouldFindDocs).toHaveLength(0);
  });
});

describe("Document.removeAnchors", () => {
  test("should remove only tags entities from document", () => {
    const document = new Document({
      content:
        "some text <id123>other text</id123> additional <id342>blah </id342>ds>> >>?!<@>hello",
      entityIds: ["id123", "id342"],
    });
    document.removeAnchors(["id123"]);
    expect(document.content).toEqual(
      "some text other text additional <id342>blah </id342>ds>> >>?!<@>hello"
    );
    expect(document.entityIds.find((e) => e === "id123")).toBeFalsy();
    expect(document.entityIds.find((e) => e === "id342")).toBeTruthy();
  });

  test("should remove all anchors", () => {
    const document = new Document({
      content:
        "some text <id123>other text</id123> <id123>other text</id123> additional <id342>blah </id342>ds>> >>?!<@>hello",
      entityIds: ["id123", "id342"],
    });
    document.removeAnchors(["id123", "id342"]);
    expect(document.content).toEqual(
      "some text other text other text additional blah ds>> >>?!<@>hello"
    );
    expect(document.entityIds).toHaveLength(0);
  });
});
