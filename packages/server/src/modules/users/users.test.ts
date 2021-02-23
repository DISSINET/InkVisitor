import { BadParams } from "@common/errors";
import * as chai from "chai";
import "mocha";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";
const should = chai.should();

describe("Users signin", function () {
  describe("Empty body", () => {
    it("should return a 400 code with bad params error", (done) => {
      return request(app)
        .post(`${apiPath}/users/signin`)
        .expect("Content-Type", /json/)
        .expect({ error: new BadParams("whatever").toString() })
        .expect(400, done);
    });
  });
});
