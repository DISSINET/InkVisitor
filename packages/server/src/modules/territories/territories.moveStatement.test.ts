import { expect } from "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { IStatement, ITerritory } from "@shared/types";
import { Db } from "@service/RethinkDB";
import {
  createActant,
  deleteActant,
  findActantById,
} from "@service/shorthands";

const randSuffix = Math.random();
async function createMockStatementsWithTerritory(
  db: Db
): Promise<IStatement[]> {
  const ter: ITerritory = {
    id: `root-${randSuffix}`,
    class: "T",
    labels: [],
    data: {
      content: "",
      lang: "",
      parent: false,
      type: "",
    },
  };

  // create the territory first
  await createActant(db, ter, true);

  const out: IStatement[] = [
    {
      id: `s1-${randSuffix}`,
      class: "S",
      labels: [],
      data: {
        actants: [],
        action: "",
        certainty: "",
        elvl: "",
        modality: "",
        note: "",
        props: [],
        references: [],
        tags: [],
        territory: {
          id: ter.id,
          order: 1,
        },
        text: "",
      },
    },
    {
      id: `s2-${randSuffix}`,
      class: "S",
      labels: [],
      data: {
        actants: [],
        action: "",
        certainty: "",
        elvl: "",
        modality: "",
        note: "",
        props: [],
        references: [],
        tags: [],
        territory: {
          id: ter.id,
          order: 2,
        },
        text: "",
      },
    },
  ];

  for (const stat of out) {
    await createActant(db, stat, true);
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

      expect(s1.data.territory.order).to.be.eq(1);
      expect(s2.data.territory.order).to.be.eq(2);

      await request(app)
        .post(`${apiPath}/territories/moveStatement`)
        .send({
          moveId: statements[1].id,
          newIndex: 0,
        })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect({ result: true });

      s1 = await findActantById<IStatement>(db, statements[0].id);
      s2 = await findActantById<IStatement>(db, statements[1].id);

      console.log(s1.id, s1.data.territory.order);
      console.log(s2.id, s2.data.territory.order);

      expect(s1.data.territory.order).to.be.eq(2);
      expect(s2.data.territory.order).to.be.eq(1);

      for (const stat of statements) {
        await deleteActant(db, stat.id);
      }
      return done();
    });
  });
});
