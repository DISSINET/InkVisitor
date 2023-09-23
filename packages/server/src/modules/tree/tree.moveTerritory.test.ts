import { createMockTree, clean } from "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { ITerritory } from "@shared/types";
import { Db } from "@service/rethink";
import {
  deleteAudits,
  deleteEntities,
  deleteRelations,
  findEntityById,
} from "@service/shorthands";
import { EntityEnums } from "@shared/enums";

describe("Tree moveTerritory", function () {
  const db = new Db();

  beforeAll(async () => {
    await db.initDb();
  });

  afterAll(async () => {
    await clean(db);
  });

  describe("Move T1 after T2", () => {
    const randSuffix = "tree-moveTerritory-" + Math.random().toString();
    let t1: ITerritory, t2: ITerritory, t1_1: ITerritory, t1_2: ITerritory;

    it("should create valid tree", async () => {
      await createMockTree(db, randSuffix);

      t1 = await findEntityById<ITerritory>(db, `T1-${randSuffix}`);
      t2 = await findEntityById<ITerritory>(db, `T2-${randSuffix}`);
      t1_1 = await findEntityById<ITerritory>(db, `T1-1-${randSuffix}`);
      t1_2 = await findEntityById<ITerritory>(db, `T1-2-${randSuffix}`);

      expect(t1.data.parent ? t1.data.parent.order : -1).toEqual(0);
      expect(t2.data.parent ? t2.data.parent.order : -1).toEqual(1);
      expect(t1_1.data.parent ? t1_1.data.parent.order : -1).toEqual(0);
      expect(t1_2.data.parent ? t1_2.data.parent.order : -1).toEqual(1);
    });

    it("should return a 200 code with IResponseGeneric success response", async (done) => {
      await request(app)
        .patch(`${apiPath}/tree/${t1.id}/position`)
        .send({
          parentId: `root-${randSuffix}`,
          newIndex: EntityEnums.Order.Last,
        })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect({ result: true });

      t1 = await findEntityById<ITerritory>(db, t1.id);
      t2 = await findEntityById<ITerritory>(db, t2.id);

      expect(t1.data.parent ? t1.data.parent.order : -1).toEqual(2); // pushed to the end
      expect(t2.data.parent ? t2.data.parent.order : 0).toEqual(1); // remains the same

      return done();
    });

    afterAll(async () => {
      await deleteEntities(db);
      await deleteAudits(db);
      await deleteRelations(db);
    });
  });

  describe("Move T1-1 under T2", () => {
    const randSuffix = "tree-moveTerritory-" + Math.random().toString();
    let t1: ITerritory,
      t2: ITerritory,
      t1_1: ITerritory,
      t1_2: ITerritory,
      t2_1: ITerritory,
      t2_2: ITerritory;

    it("should create valid tree", async () => {
      await createMockTree(db, randSuffix);

      t1 = await findEntityById<ITerritory>(db, `T1-${randSuffix}`);
      t2 = await findEntityById<ITerritory>(db, `T2-${randSuffix}`);
      t1_1 = await findEntityById<ITerritory>(db, `T1-1-${randSuffix}`);
      t1_2 = await findEntityById<ITerritory>(db, `T1-2-${randSuffix}`);
      t2_1 = await findEntityById<ITerritory>(db, `T2-1-${randSuffix}`);
      t2_2 = await findEntityById<ITerritory>(db, `T2-2-${randSuffix}`);

      expect(t1.data.parent ? t1.data.parent.order : -1).toEqual(0);
      expect(t2.data.parent ? t2.data.parent.order : -1).toEqual(1);
      expect(t1_1.data.parent ? t1_1.data.parent.order : -1).toEqual(0);
      expect(t1_2.data.parent ? t1_2.data.parent.order : -1).toEqual(1);
      expect(t2_1.data.parent ? t2_1.data.parent.order : -1).toEqual(0);
      expect(t2_2.data.parent ? t2_2.data.parent.order : -1).toEqual(1);
    });

    it("should return a 200 code with IResponseGeneric success response", async (done) => {
      await request(app)
        .patch(`${apiPath}/tree/${t1_1.id}/position`)
        .send({
          parentId: t2.id,
          newIndex: 0, // doesnt matter, should be pushed to the end
        })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect({ result: true });

      const new_t1 = await findEntityById<ITerritory>(db, t1.id);
      const new_t2 = await findEntityById<ITerritory>(db, t2.id);
      const new_t1_1 = await findEntityById<ITerritory>(db, t1_1.id);
      const new_t1_2 = await findEntityById<ITerritory>(db, t1_2.id);
      const new_t2_1 = await findEntityById<ITerritory>(db, t2_1.id);
      const new_t2_2 = await findEntityById<ITerritory>(db, t2_2.id);

      // should remain unchanged
      expect(new_t1.data.parent ? new_t1.data.parent.order : -1).toEqual(
        t1.data.parent ? t1.data.parent.order : -1
      );
      expect(new_t1_2.data.parent ? new_t1_2.data.parent.order : -1).toEqual(
        t1_2.data.parent ? t1_2.data.parent.order : -1
      );
      expect(new_t2.data.parent ? new_t2.data.parent.order : -1).toEqual(
        t2.data.parent ? t2.data.parent.order : -1
      );
      expect(new_t2_1.data.parent ? new_t2_1.data.parent.order : -1).toEqual(
        t2_1.data.parent ? t2_1.data.parent.order : -1
      );
      expect(new_t2_2.data.parent ? new_t2_2.data.parent.order : -1).toEqual(
        t2_2.data.parent ? t2_2.data.parent.order : -1
      );

      // should be last child under T2
      expect(new_t1_1.data.parent ? new_t1_1.data.parent.order : -1).toEqual(
        t2_2.data.parent ? t2_2.data.parent.order + 1 : -1
      );

      return done();
    });

    afterAll(async () => {
      await deleteEntities(db);
      await deleteAudits(db);
      await deleteRelations(db);
    });
  });
});
