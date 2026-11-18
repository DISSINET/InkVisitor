import { EntityEnums } from "@inkvisitor/shared/enums";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";
import Document from "@models/document/document";
import Person from "@models/person/person";
import Territory from "@models/territory/territory";
import { Db } from "@service/storage";
import { clean } from "@modules/common.test";

// document tag names exclude ".", so the anchored ids are dot-free
const tagSafeId = () => Math.random().toString().replace(/\./g, "");
const tag = (id: string, text: string) => `<${id}>${text}</${id}>`;
// every anchor of the tree, a nested one as "parent>child"
const anchorIds = (nodes: IAnchorsNode[]): string[] =>
  ([] as string[]).concat(
    ...nodes.map((node) => [
      node.anchor,
      ...anchorIds(node.children).map((id) => `${node.anchor}>${id}`),
    ])
  );

describe("Document.rebuildAnchors", () => {
  let db: Db;

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  afterAll(async () => {
    await clean(db);
  });

  it("rebuilds a stale stored tree and leaves an up-to-date document alone", async () => {
    // a territory without a parent saves only as a root, named "root..."
    const territory = new Territory({ id: `root${tagSafeId()}` });
    const person = new Person({ id: tagSafeId() });
    await territory.save(db.connection);
    await person.save(db.connection);

    // the stored tree lists only the territory, as if built before the person existed
    const content = tag(territory.id, `<hi>Peter</hi> met ${tag(person.id, "Paul")}`);
    const stale = new Document({ id: tagSafeId(), content });
    await stale.preprocess(db.connection);
    stale.anchors.forEach((node) => (node.children = []));
    await stale.save(db.connection);

    const fresh = new Document({ id: tagSafeId(), content: tag(person.id, "Paul") });
    await fresh.preprocess(db.connection);
    await fresh.save(db.connection);
    const freshBefore = await Document.getDocumentById(db.connection, fresh.id);

    expect(await Document.rebuildAnchors(db.connection, { dryRun: true })).toEqual({
      checked: 2,
      rebuilt: 1,
    });
    expect(
      anchorIds((await Document.getDocumentById(db.connection, stale.id))?.anchors || [])
    ).toEqual([territory.id]);

    expect(await Document.rebuildAnchors(db.connection)).toEqual({ checked: 2, rebuilt: 1 });

    const rebuilt = await Document.getDocumentById(db.connection, stale.id);
    expect(anchorIds(rebuilt?.anchors || [])).toEqual([territory.id, `${territory.id}>${person.id}`]);
    expect(rebuilt?.anchors[0].class).toEqual(EntityEnums.Class.Territory);
    expect(rebuilt?.content).toEqual(content);
    expect(rebuilt?.updatedAt).toEqual(stale.updatedAt);
    expect(await Document.getDocumentById(db.connection, fresh.id)).toEqual(freshBefore);

    expect(await Document.rebuildAnchors(db.connection)).toEqual({ checked: 2, rebuilt: 0 });
  });
});
