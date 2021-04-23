import { expect } from "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { ITerritory } from "@shared/types";
import Territory from "@models/territory";
import { Db } from "@service/RethinkDB";
import {
  createActant,
  deleteActant,
  findActantById,
} from "@service/shorthands";

const randSuffix = Math.random();
async function createMockTree(db: Db): Promise<ITerritory[]> {
  const out: Territory[] = [
    new Territory({
      id: `root-${randSuffix}`,
    }),
    new Territory({
      id: `lvl1-1-${randSuffix}`,
      data: {
        parent: {
          id: `root-${randSuffix}`,
          order: 1,
        },
      },
    }),
    new Territory({
      id: `lvl1-2-${randSuffix}`,
      data: {
        parent: {
          id: `root-${randSuffix}`,
          order: 2,
        },
      },
    }),
  ];

  for (const ter of out) {
    await createActant(db, ter);
  }
  return out;
}

describe("Tree moveTerritory", function () {
  describe("Move lvl1-2 before lvl1-1", () => {
    it("should return a 200 code with IResponseGeneric success response", async (done) => {
      const db = new Db();
      await db.initDb();
      const territories = await createMockTree(db);

      let lvl11 = await findActantById<ITerritory>(db, `lvl1-1-${randSuffix}`);
      let lvl12 = await findActantById<ITerritory>(db, `lvl1-2-${randSuffix}`);
      expect(lvl11.data.parent ? lvl11.data.parent.id : "").to.be.eq(
        `root-${randSuffix}`
      );
      expect(lvl11.data.parent ? lvl11.data.parent.order : 0).to.be.eq(1);
      expect(lvl12.data.parent ? lvl12.data.parent.id : "").to.be.eq(
        `root-${randSuffix}`
      );
      expect(lvl12.data.parent ? lvl12.data.parent.order : 0).to.be.eq(2);

      await request(app)
        .post(`${apiPath}/tree/moveTerritory`)
        .send({
          moveId: `lvl1-2-${randSuffix}`,
          parentId: `root-${randSuffix}`,
          newIndex: 0,
        })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect({ result: true });

      lvl11 = await findActantById<ITerritory>(db, `lvl1-1-${randSuffix}`);
      lvl12 = await findActantById<ITerritory>(db, `lvl1-2-${randSuffix}`);
      expect(lvl11.data.parent ? lvl11.data.parent.id : "").to.be.eq(
        `root-${randSuffix}`
      );
      expect(lvl11.data.parent ? lvl11.data.parent.order : 0).to.be.eq(2);
      expect(lvl12.data.parent ? lvl12.data.parent.id : "").to.be.eq(
        `root-${randSuffix}`
      );
      expect(lvl12.data.parent ? lvl12.data.parent.order : 0).to.be.eq(1);

      for (const ter of territories) {
        await deleteActant(db, ter.id);
      }
      return done();
    });
  });
});
