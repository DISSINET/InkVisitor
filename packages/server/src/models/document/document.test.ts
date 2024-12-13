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

describe("Document.buildAnchorsTree", () => {
  const content = `header: /,/.
    <tag1>
        Hello, this is <tag2>some <tag3>deeply nested</tag3> text</tag2> 
        within <tag4>multiple <tag5>levels</tag5> of tags</tag4>.
    </tag1>
    <tag6>Another root tag</tag6>
    <tag7>
        <tag8>More nested <tag9>content</tag9></tag8>
    </tag7>

    // footer //
`;
  const document = new Document({
    content: content,
  });

  const tree = document.buildAnchorsTree();
  it("should contain 3 root anchors", () => {
    expect(tree).toHaveLength(3);
  });

  it("should have tag1 as first anchor", () => {
    expect(tree[0].anchor).toEqual("tag1");
  });

  it("should have tag1 with 2 childs", () => {
    expect(tree[0].children).toHaveLength(2);
  });

  it("should have tag1's first nested child tag2 and content valid", () => {
    expect(tree[0].children[0].anchor).toEqual("tag2");
    expect(tree[0].children[0].content).toEqual("some deeply nested text");
  });
});
