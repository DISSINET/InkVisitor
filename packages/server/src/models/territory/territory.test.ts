import "ts-jest";
import Territory from "./territory";
import { Db } from "@service/RethinkDB";
import { clean, getITerritoryMock } from "@modules/common.test";
import { findEntityById, deleteEntities } from "@service/shorthands";
import { ITerritory } from "@shared/types";

describe("Territory constructor test", function () {
  describe("empty data", () => {
    const emptyData = {};
    const emptyTerritory = new Territory({});
    it("should return empty territory", () => {
      const out = new Territory(emptyData);
      expect(JSON.stringify(out)).toEqual(JSON.stringify(emptyTerritory));
    });
  });

  describe("ok data", () => {
    const fullData = getITerritoryMock();
    fullData.data.parent = {
      territoryId: "2",
      order: -1,
    };
    const fullTerritory = new Territory(fullData);

    it("should return full territory", () => {
      expect({ ...fullData, _siblings: {} }).toEqual(fullTerritory);
    });
  });
});

describe("Territory validate test", function () {
  describe("empty data", () => {
    it("should return true", () => {
      const emptyTerritory = new Territory(undefined);
      expect(emptyTerritory.isValid()).toEqual(true);
    });
  });
  describe("ok data", () => {
    it("should return true", () => {
      const okData = new Territory({
        id: "id",
        label: "label",
        data: {
          parent: {
            territoryId: "2",
            order: 1,
          },
        },
      });
      expect(okData.isValid()).toEqual(true);
    });
  });
});

describe("Territory.delete", function () {
  describe("empty data", () => {
    it("should return error", async () => {
      const db = new Db();
      await db.initDb();

      const territory = new Territory({});

      await expect(territory.delete(db.connection)).rejects.toThrow(Error);

      await clean(db);
    });
  });

  describe("territory with child", () => {
    it("should return error", async () => {
      const db = new Db();
      await db.initDb();

      const root = new Territory({});
      await root.save(db.connection);
      const child = new Territory({ data: { parent: { id: root.id } } });
      await child.save(db.connection);

      await expect(root.delete(db.connection)).rejects.toThrow(Error);

      await clean(db);
    });
  });

  describe("leaf territory", () => {
    it("should delete the child", async () => {
      const db = new Db();
      await db.initDb();

      const root = new Territory({});
      await root.save(db.connection);
      const child = new Territory({ data: { parent: { id: root.id } } });
      await child.save(db.connection);

      await expect(child.delete(db.connection)).resolves.not.toBeNull();

      const existingChild = await findEntityById(db, child.id);

      expect(existingChild).toBeNull();

      await clean(db);
    });
  });
});

describe("Territory - save territory", function () {
  let db: Db;
  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  beforeEach(async () => {
    await deleteEntities(db);
  });

  afterAll(async () => {
    await db.close();
  });

  describe("save territory without parent", () => {
    it("should have empty parent prop", async (done) => {
      const territory = new Territory(undefined);
      territory.id = "T0";
      await territory.save(db.connection);

      const createdData = await findEntityById<ITerritory>(db, territory.id);
      expect(createdData.data.parent).toEqual(false);

      done();
    });
  });

  describe("save territory with parent", () => {
    it("should have order as expected", async (done) => {
      const territory = new Territory({
        data: { parent: { id: "any", order: 999 } },
      });
      await territory.save(db.connection);

      const createdData = await findEntityById<ITerritory>(db, territory.id);
      expect((createdData.data.parent as any).id).toEqual(
        (territory.data.parent as any).id
      );
      expect((createdData.data.parent as any).order).toEqual(
        (territory.data.parent as any).order
      );
      done();
    });
  });

  describe("save two territories without explicit orders", () => {
    it("should have orders 0 and 1 respectively", async (done) => {
      const territory1 = new Territory({
        data: { parent: { id: "any" } },
      });
      await territory1.save(db.connection);
      const territory2 = new Territory({
        data: { parent: { id: "any" } },
      });
      await territory2.save(db.connection);

      const createdData1 = await findEntityById<ITerritory>(db, territory1.id);
      expect(createdData1.data.parent).toEqual(territory1.data.parent);
      expect((createdData1.data.parent as any).order).toEqual(0);

      const createdData2 = await findEntityById<ITerritory>(db, territory2.id);
      expect(createdData2.data.parent).toEqual(territory2.data.parent);
      expect((createdData2.data.parent as any).order).toEqual(1);

      done();
    });
  });

  describe("save three territories with explicit orders", () => {
    it("should have orders as provided", async (done) => {
      const territory1 = new Territory({
        data: { parent: { id: "any", order: 14 } },
      });
      await territory1.save(db.connection);
      const territory2 = new Territory({
        data: { parent: { id: "any", order: 0 } },
      });
      await territory2.save(db.connection);
      const territory3 = new Territory({
        data: { parent: { id: "any" } },
      });
      await territory3.save(db.connection);

      // first territory's order is set without conflict
      const createdData1 = await findEntityById<ITerritory>(db, territory1.id);
      expect(createdData1.data.parent).toEqual(territory1.data.parent);
      expect((createdData1.data.parent as any).order).toEqual(14);

      // second territory's order is set without conflict
      const createdData2 = await findEntityById<ITerritory>(db, territory2.id);
      expect(createdData2.data.parent).toEqual(territory2.data.parent);
      expect((createdData2.data.parent as any).order).toEqual(0);

      // third territory's order is not set, is pushed to the end
      const createdData3 = await findEntityById<ITerritory>(db, territory3.id);
      expect(createdData3.data.parent).toEqual(territory3.data.parent);
      expect((createdData3.data.parent as any).order).toEqual(14 + 1);

      done();
    });
  });
});

describe("Territory - update territory", function () {
  let db: Db;
  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  beforeEach(async () => {
    await deleteEntities(db);
  });

  afterAll(async () => {
    await db.close();
  });

  describe("update territory without parent", () => {
    it("should have empty parent prop, but set lavel prop", async (done) => {
      const territory = new Territory(undefined);
      territory.id = "T0";
      await territory.save(db.connection);

      await territory.update(db.connection, { label: "new label" });

      const createdData = await findEntityById<ITerritory>(db, territory.id);
      expect(createdData.data.parent).toEqual(false);
      expect(createdData.label).toEqual("new label");

      done();
    });
  });

  describe("update territory with new parent without explicit order", () => {
    it("should have order as expected", async (done) => {
      const territory = new Territory(undefined);
      territory.id = "T0";
      await territory.save(db.connection);
      await territory.update(db.connection, {
        data: { parent: { id: "new" } },
      });

      const createdData = await findEntityById<ITerritory>(db, territory.id);
      expect(createdData.data.parent).toEqual(territory.data.parent as any);
      expect((createdData.data.parent as any).order).toEqual(0);
      expect((createdData.data.parent as any).id).toEqual("new");

      done();
    });
  });

  describe("update territory with new parent with explicit order", () => {
    it("should have order as expected", async (done) => {
      const territory = new Territory(undefined);
      territory.id = "T0";
      await territory.save(db.connection);
      await territory.update(db.connection, {
        data: { parent: { id: "new", order: 90 } },
      });

      const createdData = await findEntityById<ITerritory>(db, territory.id);
      expect(createdData.data.parent).toEqual(territory.data.parent as any);
      expect((createdData.data.parent as any).order).toEqual(90);
      expect((createdData.data.parent as any).id).toEqual("new");

      done();
    });
  });
});
/*
describe("Territory - test getClosestRight", function () {
  describe("no input rights", () => {
    it("should return undefined as no closest right found", async (done) => {
      const territory = new Territory(undefined);

      expect(territory.getClosestRight([])).toEqual(undefined);
      done();
    });
  });

  describe("right with equal id", () => {
    it("should return the right object", async (done) => {
      const territory = new Territory({ id: "this" });
      const right = new UserRight({
        mode: UserRoleMode.Admin,
        territory: "this",
      });
      expect(territory.getClosestRight([right])).toEqual(right);
      done();
    });
  });

  describe("right defined for parent territory", () => {
    it("should return the same right object as was defined for the parent", async (done) => {
      const territory = new Territory({ id: "thisthat" });
      const right = new UserRight({
        mode: UserRoleMode.Admin,
        territory: "this",
      });
      expect(territory.getClosestRight([right])).toEqual(right);
      done();
    });
  });

  describe("right defined for child territory", () => {
    it("should return undefined", async (done) => {
      const territory = new Territory({ id: "that" });
      const right = new UserRight({
        mode: UserRoleMode.Admin,
        territory: "this",
      });
      expect(territory.getClosestRight([right])).toEqual(undefined);
      done();
    });
  });
});
*/
