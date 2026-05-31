import { clean } from "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import Person from "@models/person/person";
import Concept from "@models/concept/concept";
import Classification from "@models/relation/classification";
import { RelationEnums } from "@inkvisitor/shared/enums";

describe("Entities relations get method", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Correct param", () => {
    const db = new Db();
    const rand = Math.random().toString();
    const personEntity = new Person({ id: `P-${rand}` });
    const conceptEntity = new Concept({ id: `C-${rand}` });
    const relation = new Classification({
      entityIds: [personEntity.id, conceptEntity.id],
    });

    beforeAll(async () => {
      await db.initDb();
      await personEntity.save(db.connection);
      await conceptEntity.save(db.connection);
      await relation.save(db.connection);
    });

    afterAll(async () => await clean(db));

    it("should return relations filtered by the requested type", async () => {
      await request(app)
        .get(`${apiPath}/entities/${personEntity.id}/relations`)
        .query(`filters[relationType]=${RelationEnums.Type.Classification}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toEqual(true);
          expect(res.body.length).toEqual(1);
          expect(res.body[0].id).toEqual(relation.id);
          expect(res.body[0].type).toEqual(RelationEnums.Type.Classification);
          expect(res.body[0].entityIds).toEqual(relation.entityIds);
        });
    });

    it("should return an empty array when no relation of the requested type exists", async () => {
      await request(app)
        .get(`${apiPath}/entities/${personEntity.id}/relations`)
        .query(`filters[relationType]=${RelationEnums.Type.Superclass}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toEqual(true);
          expect(res.body.length).toEqual(0);
        });
    });
  });
});
