import * as chai from "chai";
import "mocha";
import request from "supertest";
import { apiPath } from "../../common/constants";
import app from "../../Server";

const should = chai.should();

describe("Users signin", function () {
  it("should return a string", () => {
    return request(app)
      .get(`${apiPath}/users/signin`)
      .expect("Content-Type", /json/)
      .expect("Content-Length", "4")
      .expect(200, "ok");
  });
});
