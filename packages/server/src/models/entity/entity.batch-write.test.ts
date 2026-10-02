import "ts-jest";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import { EntityEnums } from "@inkvisitor/shared/enums";
import Entity from "./entity";

// The bulk writes report per id: a document that fails or no longer exists is
// failed, while the rest of its chunk still counts as written.
describe("Entity bulk writes", function () {
  let db: Db;
  const run = Math.random().toString();

  const concept = (suffix: string): Entity => {
    const entity = new Entity({
      id: `test-bw-${run}-${suffix}`,
      class: EntityEnums.Class.Concept,
    });
    entity.labels = [`${entity.id}-label`];
    return entity;
  };

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  it("saveMany fails only the document that could not be inserted", async () => {
    const existing = concept("existing");
    await existing.save(db.connection);
    const fresh = concept("fresh");

    const { written, failed } = await Entity.saveMany(db.connection, [
      fresh,
      concept("existing"),
    ]);

    expect(written).toEqual([fresh.id]);
    expect(failed).toEqual([existing.id]);
  });

  it("updateMany fails an id that no longer exists", async () => {
    const present = concept("present");
    await present.save(db.connection);
    const missingId = `test-bw-${run}-missing`;

    const { written, failed } = await Entity.updateMany(
      db.connection,
      [present.id, missingId],
      { language: EntityEnums.Language.Latin }
    );

    expect(written).toEqual([present.id]);
    expect(failed).toEqual([missingId]);
  });

  it("updateEach fails an id that no longer exists", async () => {
    const present = concept("present-each");
    await present.save(db.connection);
    const missingId = `test-bw-${run}-missing-each`;

    const { written, failed } = await Entity.updateEach(db.connection, [
      { id: present.id, data: { language: EntityEnums.Language.Latin } },
      { id: missingId, data: { language: EntityEnums.Language.Latin } },
    ]);

    expect(written).toEqual([present.id]);
    expect(failed).toEqual([missingId]);
  });

  it("counts an update that leaves the value as it was as written", async () => {
    const same = concept("same");
    same.language = EntityEnums.Language.Latin;
    await same.save(db.connection);

    const { written } = await Entity.updateMany(db.connection, [same.id], {
      language: EntityEnums.Language.Latin,
    });

    expect(written).toEqual([same.id]);
  });
});
