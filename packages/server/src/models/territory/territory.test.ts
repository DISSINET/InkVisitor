import "ts-jest";
import Territory, { TerritoryParent } from "./territory";
import { Db } from "@service/RethinkDB";
import { clean, getITerritoryMock } from "@modules/common.test";
import { findEntityById, deleteEntities } from "@service/shorthands";
import { IParentTerritory, ITerritory } from "@shared/types";

describe("models/territory", function () {
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
        expect(fullData).toEqual(JSON.parse(JSON.stringify(fullTerritory)));
      });
    });
  });

  describe("Territory validate test", function () {
    describe("empty data", () => {
      it("should return true", () => {
        const emptyTerritory = new Territory({});
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
    let db: Db;
    beforeAll(async () => {
      db = new Db();
      await db.initDb();
    });

    describe("empty data", () => {
      it("should return error", async () => {
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
        const child = new Territory({ data: { parent: { territoryId: root.id, order: 0 } } });
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
        const child = new Territory({ data: { parent: { territoryId: root.id, order: 0 } } });
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
        const territory = new Territory({});
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
          data: { parent: { territoryId: "any", order: 999 } },
        });
        await territory.save(db.connection);

        const createdData = await findEntityById<ITerritory>(db, territory.id);
        const got = createdData.data.parent as IParentTerritory;
        const expected = territory.data.parent as IParentTerritory;

        expect(got.territoryId).toEqual(expected.territoryId);
        expect(got.order).toEqual(expected.order);
        done();
      });
    });

    describe("save two territories without explicit orders", () => {
      it("should have orders 0 and 1 respectively", async (done) => {
        const territory1 = new Territory({
          data: { parent: { territoryId: "any", order: 0 } },
        });
        await territory1.save(db.connection);
        const territory2 = new Territory({
          data: { parent: { territoryId: "any", order: 0 } },
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
          data: { parent: { territoryId: "any", order: 14 } },
        });
        await territory1.save(db.connection);
        const territory2 = new Territory({
          data: { parent: { territoryId: "any", order: 0 } },
        });
        await territory2.save(db.connection);
        const territory3 = new Territory({
          data: { parent: { territoryId: "any", order: 3 } },
        });
        await territory3.save(db.connection);

        // first territory's order is altered - no sibling -> use always 0
        const createdData1 = await findEntityById<ITerritory>(db, territory1.id);
        expect(createdData1.data.parent).toEqual(territory1.data.parent);
        expect((createdData1.data.parent as any).order).toEqual(0);

        // 0 order takes from 1. entry -> use 0 + 1
        const createdData2 = await findEntityById<ITerritory>(db, territory2.id);
        expect(createdData2.data.parent).toEqual(territory2.data.parent);
        expect((createdData2.data.parent as any).order).toEqual(1);

        // third territory's order is not set -> use it
        const createdData3 = await findEntityById<ITerritory>(db, territory3.id);
        expect(createdData3.data.parent).toEqual(territory3.data.parent);
        expect((createdData3.data.parent as any).order).toEqual(3);

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
        const territory = new Territory({});
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
        const territory = new Territory({ id: "T0" });
        await territory.save(db.connection);
        await territory.update(db.connection, {
          data: { parent: { territoryId: "new", order: 0 } as IParentTerritory },
        });

        const createdData = await findEntityById<ITerritory>(db, territory.id);
        expect(createdData.data.parent).toEqual(territory.data.parent);
        expect((createdData.data.parent as IParentTerritory).order).toEqual(0);
        expect((createdData.data.parent as IParentTerritory).territoryId).toEqual("new");

        done();
      });
    });

    describe("update territory so it is sibling to existing one", () => {
      it("should have order set to wanted value", async (done) => {
        const parent = new TerritoryParent({ territoryId: "parent" })
        const territory1 = new Territory({});
        territory1.data.parent = parent
        const territory2 = new Territory({});
        territory2.data.parent = parent

        await territory1.save(db.connection);
        await territory2.save(db.connection);

        const wantedOrder = 90
        await territory2.update(db.connection, {
          data: { parent: { territoryId: parent.territoryId, order: wantedOrder } },
        });

        const updatedTerritory = await findEntityById<ITerritory>(db, territory2.id);
        expect(updatedTerritory.data.parent).toEqual(territory2.data.parent);
        expect((updatedTerritory.data.parent as IParentTerritory).order).toEqual(wantedOrder);
        expect((updatedTerritory.data.parent as IParentTerritory).territoryId).toEqual(parent.territoryId);

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
          mode: UserEnums.RoleMode.Admin,
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
          mode: UserEnums.RoleMode.Admin,
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
          mode: UserEnums.RoleMode.Admin,
          territory: "this",
        });
        expect(territory.getClosestRight([right])).toEqual(undefined);
        done();
      });
    });
  });
  */
});