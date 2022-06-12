import request from "supertest";
import { supertestConfig } from "./modules";
import { apiPath } from "@common/constants";
import app from "./Server";
import { unknownRouteError, unauthorizedError } from "@middlewares/errors";
import { IResponseGeneric, errorTypes } from "@shared/types/response-generic";
import "ts-jest";

describe("Test unknown route", function () {
  it("should return an unknownRouteError wrapped in IResponeGeneric response", async (done) => {
    await request(app)
      .get(`${apiPath}/random/get`)
      .set("authorization", "Bearer " + supertestConfig.token)
      .expect(unknownRouteError.statusCode())
      .expect({
        result: false,
        error: unknownRouteError.constructor.name as errorTypes,
        message: unknownRouteError.message,
      } as IResponseGeneric);

    return done();
  });
});

describe("Test unauthorized request", function () {
  it("should return an unauthorizedError wrapped in IResponeGeneric response", async (done) => {
    await request(app)
      .get(`${apiPath}/users/122322`)
      .expect(unauthorizedError.statusCode())
      .expect({
        result: false,
        error: unauthorizedError.constructor.name as errorTypes,
        message: unauthorizedError.message,
      } as IResponseGeneric);

    return done();
  });
});
