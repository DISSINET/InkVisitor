import { BadParams, UserDoesNotExits } from "@common/errors";
import * as chai from "chai";
import "mocha";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { createUser, getActantUsage } from "../../service/shorthands";
import { Db } from "@service/RethinkDB";

const should = chai.should();
const expect = chai.expect;

describe("Users administration", function () {
  describe("Default check", () => {
    it("should return a 200 code", () => {
      return request(app)
        .get(`${apiPath}/users/administration`)
        .expect(200)
        .expect((res) => {
          res.body.should.not.empty;
          res.body.should.be.a("object");
          res.body.should.have.keys("users");
          res.body.users.should.be.a("array");
        });
    });
  });
});
