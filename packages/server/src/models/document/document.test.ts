import "ts-jest";
import { Db } from "@service/rethink";
import { clean, newMockRequest } from "@modules/common.test";
import { prepareEntity } from "@models/entity/entity.test";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { prepareRelation } from "@models/relation/relation.test";
import Document from "./document";
import { AnchorsNode } from "./anchors";

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
    document1.entityIds = {
      [EntityEnums.Class.Person]: [docEntity1.id, docEntity2.id],
      [EntityEnums.Class.Action]: [],
      [EntityEnums.Class.Territory]: [],
      [EntityEnums.Class.Statement]: [],
      [EntityEnums.Class.Resource]: [],
      [EntityEnums.Class.Being]: [],
      [EntityEnums.Class.Group]: [],
      [EntityEnums.Class.Object]: [],
      [EntityEnums.Class.Concept]: [],
      [EntityEnums.Class.Location]: [],
      [EntityEnums.Class.Value]: [],
      [EntityEnums.Class.Event]: []
    };
    await document1.save(db.connection);
    // force ids
    document2.entityIds = {
      [EntityEnums.Class.Person]: [docEntity1.id],
      [EntityEnums.Class.Action]: [],
      [EntityEnums.Class.Territory]: [],
      [EntityEnums.Class.Statement]: [],
      [EntityEnums.Class.Resource]: [],
      [EntityEnums.Class.Being]: [],
      [EntityEnums.Class.Group]: [],
      [EntityEnums.Class.Object]: [],
      [EntityEnums.Class.Concept]: [],
      [EntityEnums.Class.Location]: [],
      [EntityEnums.Class.Value]: [],
      [EntityEnums.Class.Event]: []
    };
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
      entityIds: {
        [EntityEnums.Class.Person]: ["id123", "id342"],
        [EntityEnums.Class.Action]: [],
        [EntityEnums.Class.Territory]: [],
        [EntityEnums.Class.Statement]: [],
        [EntityEnums.Class.Resource]: [],
        [EntityEnums.Class.Being]: [],
        [EntityEnums.Class.Group]: [],
        [EntityEnums.Class.Object]: [],
        [EntityEnums.Class.Concept]: [],
        [EntityEnums.Class.Location]: [],
        [EntityEnums.Class.Value]: [],
        [EntityEnums.Class.Event]: []
      },
    });
    document.removeAnchors(["id123"]);
    expect(document.content).toEqual(
      "some text other text additional <id342>blah </id342>ds>> >>?!<@>hello"
    );
    expect(document.entityIds[EntityEnums.Class.Person].find((e) => e === "id123")).toBeFalsy();
    expect(document.entityIds[EntityEnums.Class.Person].find((e) => e === "id342")).toBeTruthy();
  });

  test("should remove all anchors", () => {
    const document = new Document({
      content:
        "some text <id123>other text</id123> <id123>other text</id123> additional <id342>blah </id342>ds>> >>?!<@>hello",
      entityIds: {
        [EntityEnums.Class.Person]: ["id123", "id342"],
        [EntityEnums.Class.Action]: [],
        [EntityEnums.Class.Territory]: [],
        [EntityEnums.Class.Statement]: [],
        [EntityEnums.Class.Resource]: [],
        [EntityEnums.Class.Being]: [],
        [EntityEnums.Class.Group]: [],
        [EntityEnums.Class.Object]: [],
        [EntityEnums.Class.Concept]: [],
        [EntityEnums.Class.Location]: [],
        [EntityEnums.Class.Value]: [],
        [EntityEnums.Class.Event]: []
      },
    });
    document.removeAnchors(["id123", "id342"]);
    expect(document.content).toEqual(
      "some text other text other text additional blah ds>> >>?!<@>hello"
    );
    expect(document.entityIds[EntityEnums.Class.Person]).toHaveLength(0);
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
  // anchors are no longer auto-built in the constructor; they are produced by
  // AnchorsNode.buildAnchorsTree (called from Document.preprocess at write time)
  // and only tags whose ids are present in entityIds become nodes.
  const entityIds = {
    ...Document.emptyEntityIdsRecord(),
    [EntityEnums.Class.Person]: [
      "tag1",
      "tag2",
      "tag3",
      "tag4",
      "tag5",
      "tag6",
      "tag7",
      "tag8",
      "tag9",
    ],
  };

  const tree = AnchorsNode.buildAnchorsTree(content, entityIds);
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

describe("Document export filtering", () => {
  test("should keep entities from exported classes and unknown entities", () => {
    const document = new Document({
      content: "Text with <entity1>known entity</entity1> and <unknown1>unknown entity</unknown1> and <entity2>another known</entity2>",
      entityIds: {
        [EntityEnums.Class.Person]: ["entity1"],
        [EntityEnums.Class.Action]: ["entity2"],
        [EntityEnums.Class.Territory]: [],
        [EntityEnums.Class.Statement]: [],
        [EntityEnums.Class.Resource]: [],
        [EntityEnums.Class.Being]: [],
        [EntityEnums.Class.Group]: [],
        [EntityEnums.Class.Object]: [],
        [EntityEnums.Class.Concept]: [],
        [EntityEnums.Class.Location]: [],
        [EntityEnums.Class.Value]: [],
        [EntityEnums.Class.Event]: []
      }
    });

    // Simulate the export filtering logic
    const exportedEntities = [EntityEnums.Class.Person]; // Only export Person entities
    const openingTagRegex = /<([a-zA-Z0-9\-_]+(?:\s+[^>]*)?)>/g;
    const closingTagRegex = /<\/([a-zA-Z0-9\-_]+)>/g;
    
    let filteredContent = document.content;
    let match;
    
    // Process opening tags
    while ((match = openingTagRegex.exec(document.content)) !== null) {
      const fullTag = match[0];
      const tagContent = match[1];
      const entityId = tagContent.split(/\s+/)[0];
      
      let validEntityClass = false;
      let isUnknownEntity = true;
      
      // Check if entity exists in exported entity classes
      exportedEntities.forEach((entityClass) => {
        if (document.entityIds[entityClass]) {
          document.entityIds[entityClass].forEach((id) => {
            if (id === entityId) {
              validEntityClass = true;
              isUnknownEntity = false;
            }
          });
        }
      });
      
      // Check all entity classes to determine if this is an unknown entity
      Object.values(EntityEnums.Class).forEach((entityClass) => {
        if (document.entityIds[entityClass]) {
          document.entityIds[entityClass].forEach((id) => {
            if (id === entityId) {
              isUnknownEntity = false;
            }
          });
        }
      });

      // Keep the tag if it's in exported entities OR if it's an unknown entity
      if (!validEntityClass && !isUnknownEntity) {
        filteredContent = filteredContent.replace(fullTag, "");
      }
    }
    
    // Process closing tags
    while ((match = closingTagRegex.exec(document.content)) !== null) {
      const fullTag = match[0];
      const entityId = match[1];
      
      let validEntityClass = false;
      let isUnknownEntity = true;
      
      // Check if entity exists in exported entity classes
      exportedEntities.forEach((entityClass) => {
        if (document.entityIds[entityClass]) {
          document.entityIds[entityClass].forEach((id) => {
            if (id === entityId) {
              validEntityClass = true;
              isUnknownEntity = false;
            }
          });
        }
      });
      
      // Check all entity classes to determine if this is an unknown entity
      Object.values(EntityEnums.Class).forEach((entityClass) => {
        if (document.entityIds[entityClass]) {
          document.entityIds[entityClass].forEach((id) => {
            if (id === entityId) {
              isUnknownEntity = false;
            }
          });
        }
      });

      // Keep the tag if it's in exported entities OR if it's an unknown entity
      if (!validEntityClass && !isUnknownEntity) {
        filteredContent = filteredContent.replace(fullTag, "");
      }
    }

    // Should keep entity1 (Person class, exported) and unknown1 (unknown entity)
    // Should remove entity2 (Action class, not exported)
    expect(filteredContent).toEqual("Text with <entity1>known entity</entity1> and <unknown1>unknown entity</unknown1> and another known");
  });
});

describe("Document.getAnchorTextsForEntities", function () {
  const db = new Db();
  // Document tag names exclude ".", so keep anchored ids dot-free.
  const tagSafeId = () => Math.random().toString().replace(/\./g, "");
  const twice = new Entity({ id: tagSafeId() });
  const once = new Entity({ id: tagSafeId() });
  const unanchored = new Entity({ id: tagSafeId() });

  const doc = new Document({
    content: `a<${twice.id}>first</${twice.id}>b<${twice.id}>second</${twice.id}>c<${once.id}>only</${once.id}>d`,
  });

  beforeAll(async () => {
    await db.initDb();
    // entities must exist before preprocess so their class lands in
    // documents.entityIds and the anchors resolve.
    await twice.save(db.connection);
    await once.save(db.connection);
    await unanchored.save(db.connection);
    await doc.preprocess(db.connection);
    await doc.save(db.connection);
  });

  afterAll(async () => {
    await clean(db);
  });

  test("collects every anchor span per entity, in document order", async () => {
    const map = await Document.getAnchorTextsForEntities(db.connection, [
      twice.id,
      once.id,
    ]);
    expect(map[twice.id]).toEqual(["first", "second"]);
    expect(map[once.id]).toEqual(["only"]);
  });

  test("omits entities without anchors", async () => {
    const map = await Document.getAnchorTextsForEntities(db.connection, [
      unanchored.id,
    ]);
    expect(map[unanchored.id]).toBeUndefined();
  });

  test("returns an empty object for empty input", async () => {
    const map = await Document.getAnchorTextsForEntities(db.connection, []);
    expect(map).toEqual({});
  });
});
