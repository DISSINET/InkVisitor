import { expect, testErroneousResponse } from "@modules/common.test";
import { BadParams, TerritoryDoesNotExits } from "@shared/types/errors";
import { Db } from "@service/RethinkDB";
import { createActant, deleteActant, deleteActants } from "@service/shorthands";
import Territory from "@models/territory";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import Statement from "@models/statement";
import { supertestConfig } from "..";

describe("Territories get query", function () {
  describe("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .get(`${apiPath}/territories/get`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Wrong param", () => {
    it("should return a TerritoryDoesNotExits error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .get(`${apiPath}/territories/get/123`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(undefined, new TerritoryDoesNotExits(""))
        )
        .then(() => done());
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with IResponseTerritory response", async (done) => {
      const db = new Db();
      await db.initDb();
      await deleteActants(db);
      const testTerritoryId = Math.random().toString();
      const linkedStatementId = Math.random().toString();

      const territory: Territory = new Territory({
        id: testTerritoryId,
      });
      await createActant(db, territory);

      const statement1 = new Statement({
        id: linkedStatementId,
        data: {
          territory: {
            id: "some random",
            order: 1,
          },
        },
      });
      await createActant(db, statement1);

      const statement2 = new Statement({
        data: {
          tags: [statement1.id],
          territory: {
            id: testTerritoryId,
            order: 2,
          },
        },
      });
      await createActant(db, statement2);

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
          res.body.statements.should.have.length(1); // only one territory-link

          res.body.actants.should.be.a("array");
          res.body.actants.should.have.length(2); // todo

          expect(res.body.id).to.be.eq(testTerritoryId);
        });

      await deleteActants(db);
      return done();
    });
  });
});
