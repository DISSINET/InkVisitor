import { BadParams, TerritoryDoesNotExits } from "@common/errors";
import { Db } from "@service/RethinkDB";
import { createActant, createAction, deleteActant } from "@service/shorthands";
import { IActant, IStatement, ITerritory } from "@shared/types";
import * as chai from "chai";
import { link } from "fs";
import "mocha";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";

const should = chai.should();
const expect = chai.expect;

describe("Territories get", function () {
  describe("Empty param", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .get(`${apiPath}/territories/get`)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
  describe("Wrong param", () => {
    it("should return a 400 code with TerritoryDoesNotExits error", (done) => {
      return request(app)
        .get(`${apiPath}/territories/get/123`)
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

      const territory: ITerritory = {
        id: testTerritoryId,
        class: "T",
        data: {
          content: "",
          lang: "",
          parent: false,
          type: "",
        },
        labels: [],
      };
      await createActant(db, territory, true);

      const statement: IStatement = {
        class: "S",
        id: linkedStatementId,
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
          tags: [linkedActantId],
          territory: {
            id: testTerritoryId,
            order: 1,
          },
          text: "",
        },
      };

      const tagActant: IActant = {
        class: "S",
        labels: [],
        data: {},
        id: linkedActantId,
      };
      await createActant(db, tagActant, true);
      await createActant(db, statement, true);

      await request(app)
        .get(`${apiPath}/territories/get/${testTerritoryId}`)
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
          res.body.statements.should.have.length(1);
          res.body.statements[0].should.have.keys([...Object.keys(statement)]);

          res.body.actants.should.be.a("array");
          res.body.actants.should.have.length(1);
          res.body.actants[0].should.have.keys([...Object.keys(tagActant)]);

          expect(res.body.id).to.be.eq(testTerritoryId);
        });

      await deleteActant(db, testTerritoryId);
      await deleteActant(db, linkedStatementId);
      await deleteActant(db, linkedActantId);
      return done();
    });
  });
});
