import "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { IStatement } from "@shared/types";
import { Db } from "@service/RethinkDB";
import {
  createActant,
  findActantById,
} from "@service/shorthands";
import Territory from "@models/territory/territory";
import Statement from "@models/statement/statement";
import { clean } from "@modules/common.test";

const randSuffix = Math.random();

async function createMockStatementsWithTerritory(db: Db): Promise<Statement[]> {
  const ter: Territory = new Territory({
    id: `root-${randSuffix}`,
  });

  // create the territory first
  await createActant(db, ter);

  const out: Statement[] = [
    new Statement({
      id: `s1-${randSuffix}`,
      data: {
        territory: {
          id: ter.id,
          order: 1,
        },
      },
    }),
    new Statement({
      id: `s2-${randSuffix}`,
      data: {
        territory: {
          id: ter.id,
          order: 2,
        },
      },
    }),
  ];

  for (const stat of out) {
    await createActant(db, stat);
  }
  return out;
}

describe("Territories moveStatement", function () {
  describe("Move s2 before s1", () => {
    it("should return a 200 code with IResponseGeneric success response", async (done) => {
      const db = new Db();
      await db.initDb();
      const statements = await createMockStatementsWithTerritory(db);
      let s1 = await findActantById<IStatement>(db, statements[0].id);
      let s2 = await findActantById<IStatement>(db, statements[1].id);

      expect(s1.data.territory.order).toEqual(1);
      expect(s2.data.territory.order).toEqual(2);

      await request(app)
        .post(`${apiPath}/territories/moveStatement`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .send({
          moveId: statements[1].id,
          newIndex: 0,
        })
        .expect(200)
        .expect({ result: true });

      s1 = await findActantById<IStatement>(db, statements[0].id);
      s2 = await findActantById<IStatement>(db, statements[1].id);

      expect(s1.data.territory.order).toEqual(3);
      expect(s2.data.territory.order).toEqual(2);

      await clean(db);
      return done();
    });
  });
});
