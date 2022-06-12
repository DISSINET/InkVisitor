import { createMockTree, clean } from "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { ITerritory } from "@shared/types";
import { Db } from "@service/RethinkDB";
import { findEntityById } from "@service/shorthands";

describe("Tree moveTerritory", function () {
  describe("Move lvl1-2 before lvl1-1", () => {
    it("should return a 200 code with IResponseGeneric success response", async (done) => {
      const db = new Db();
      await db.initDb();
      const randSuffix = "tree-moveTerritory-" + Math.random().toString();
      await createMockTree(db, randSuffix);

      let lvl11 = await findEntityById<ITerritory>(db, `lvl1-1-${randSuffix}`);
      let lvl12 = await findEntityById<ITerritory>(db, `lvl1-2-${randSuffix}`);
      expect(lvl11.data.parent ? lvl11.data.parent.id : "").toEqual(
        `root-${randSuffix}`
      );
      expect(lvl11.data.parent ? lvl11.data.parent.order : 0).toEqual(1);
      expect(lvl12.data.parent ? lvl12.data.parent.id : "").toEqual(
        `root-${randSuffix}`
      );
      expect(lvl12.data.parent ? lvl12.data.parent.order : 0).toEqual(2);

      await request(app)
        .post(`${apiPath}/tree/lvl1-2-${randSuffix}/position`)
        .send({
          parentId: `root-${randSuffix}`,
          newIndex: 0,
        })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect({ result: true });

      lvl11 = await findEntityById<ITerritory>(db, `lvl1-1-${randSuffix}`);
      lvl12 = await findEntityById<ITerritory>(db, `lvl1-2-${randSuffix}`);
      expect(lvl11.data.parent ? lvl11.data.parent.id : "").toEqual(
        `root-${randSuffix}`
      );
      expect(lvl11.data.parent ? lvl11.data.parent.order : 0).toEqual(2);
      expect(lvl12.data.parent ? lvl12.data.parent.id : "").toEqual(
        `root-${randSuffix}`
      );
      expect(lvl12.data.parent ? lvl12.data.parent.order : 0).toEqual(1.5);

      await clean(db);
      return done();
    });
  });
});
