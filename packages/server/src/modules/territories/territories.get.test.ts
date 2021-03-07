import { BadParams, TerritoryDoesNotExits } from "@common/errors";
import { Db } from "@service/RethinkDB";
import { createActant } from "@service/shorthands";
import { IStatement, ITerritory } from "@shared/types";
import * as chai from "chai";
import "mocha";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";

const should = chai.should();

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
      const testUserId = Math.random().toString();
      const statement: IStatement = {
        class: "S",
        id: testUserId,
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
            id: "",
            order: 1,
          },
          text: "",
        },
      };

      await createActant(db, statement, true);
      await request(app)
        .get(`${apiPath}/territories/get/${testUserId}`)
        .expect(200)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys([
            ...Object.keys(statement),
            "statements",
            "actants",
          ]);
          res.body.id.should.not.empty;
        });
      return done();
    });
  });
});
