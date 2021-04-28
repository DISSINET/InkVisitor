import { expect } from "@modules/common.test";
import { BadParams, TerritoryDoesNotExits } from "@shared/types/errors";
import { Db } from "@service/RethinkDB";
import { createActant, deleteActant } from "@service/shorthands";
import Territory from "@models/territory";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import Statement from "@models/statement";
import { supertestConfig } from "..";

describe("Territories get", function () {
  describe("Empty param", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .get(`${apiPath}/territories/get`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Wrong param", () => {
    it("should return a 400 code with TerritoryDoesNotExits error", (done) => {
      return request(app)
        .get(`${apiPath}/territories/get/123`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect({ error: new TerritoryDoesNotExits("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with IResponseTerritory response", async (done) => {
      const db = new Db();
      await db.initDb();
      const testTerritoryId = Math.random().toString();
      const linkedStatementId = Math.random().toString();
      const linkedActantId = Math.random().toString();

      const territory: Territory = new Territory({
        id: testTerritoryId,
      });
      await createActant(db, territory);

      const statement = new Statement({
        id: linkedStatementId,
        data: {
          tags: [linkedActantId],
          territory: {
            id: testTerritoryId,
            order: 1,
          },
        },
      });

      const tagActant = new Statement({
        id: linkedActantId,
        data: {
          territory: {
            id: testTerritoryId,
            order: 2,
          },
        },
      });
      await createActant(db, tagActant);
      await createActant(db, statement);

      await request(app)
        .get(`${apiPath}/territories/get/${testTerritoryId}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys([
            ...Object.keys(territory),
            "statements",
            "actants",
          ]);

          res.body.statements.should.be.a("array");
          res.body.statements.should.have.length(2);
          res.body.statements[0].should.have.keys([...Object.keys(statement)]);

          res.body.actants.should.be.a("array");
          res.body.actants.should.have.length(0);
          //res.body.actants[0].should.have.keys([...Object.keys(tagActant)]);

          expect(res.body.id).to.be.eq(testTerritoryId);
        });

      await deleteActant(db, testTerritoryId);
      await deleteActant(db, linkedStatementId);
      await deleteActant(db, linkedActantId);
      return done();
    });
  });
});
