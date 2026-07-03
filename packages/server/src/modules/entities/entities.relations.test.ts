import { clean } from "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../server";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import Concept from "@models/concept/concept";
import Superclass from "@models/relation/superclass";
import Synonym from "@models/relation/synonym";
import { RelationEnums } from "@inkvisitor/shared/enums";

describe("Entities relations get method", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Correct param", () => {
    const db = new Db();
    const rand = Math.random().toString();
    // child --SCL--> parent (asymmetrical: child is the subject at entityIds[0])
    const childConcept = new Concept({ id: `C-child-${rand}` });
    const parentConcept = new Concept({ id: `C-parent-${rand}` });
    const superclassRelation = new Superclass({
      entityIds: [childConcept.id, parentConcept.id],
    });
    // symmetrical synonym between the two concepts
    const synonymRelation = new Synonym({
      entityIds: [childConcept.id, parentConcept.id],
    });

    beforeAll(async () => {
      await db.initDb();
      await childConcept.save(db.connection);
      await parentConcept.save(db.connection);
      await superclassRelation.save(db.connection);
      await synonymRelation.save(db.connection);
    });

    afterAll(async () => await clean(db));

    it("should return the asymmetrical relation for the subject (forward) entity", async () => {
      await request(app)
        .get(`${apiPath}/entities/${childConcept.id}/relations`)
        .query(`filters[relationType]=${RelationEnums.Type.Superclass}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toEqual(true);
          expect(res.body.length).toEqual(1);
          expect(res.body[0].id).toEqual(superclassRelation.id);
          expect(res.body[0].entityIds).toEqual(superclassRelation.entityIds);
        });
    });

    it("should NOT return the asymmetrical relation for the target (inverse) entity by default", async () => {
      await request(app)
        .get(`${apiPath}/entities/${parentConcept.id}/relations`)
        .query(`filters[relationType]=${RelationEnums.Type.Superclass}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toEqual(true);
          expect(res.body.length).toEqual(0);
        });
    });

    it("should return the inverse asymmetrical relation when forward=false", async () => {
      await request(app)
        .get(`${apiPath}/entities/${parentConcept.id}/relations`)
        .query(`filters[relationType]=${RelationEnums.Type.Superclass}&forward=false`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toEqual(true);
          expect(res.body.length).toEqual(1);
          expect(res.body[0].id).toEqual(superclassRelation.id);
        });
    });

    it("should return a symmetrical relation regardless of position", async () => {
      // childConcept is at entityIds[0]
      await request(app)
        .get(`${apiPath}/entities/${childConcept.id}/relations`)
        .query(`filters[relationType]=${RelationEnums.Type.Synonym}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toEqual(1);
          expect(res.body[0].id).toEqual(synonymRelation.id);
        });

      // parentConcept is at entityIds[1] - still returned for symmetrical types
      await request(app)
        .get(`${apiPath}/entities/${parentConcept.id}/relations`)
        .query(`filters[relationType]=${RelationEnums.Type.Synonym}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toEqual(1);
          expect(res.body[0].id).toEqual(synonymRelation.id);
        });
    });
  });
});
