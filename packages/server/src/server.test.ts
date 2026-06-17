import request from "supertest";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { apiPath } from "@common/constants";
import app from "./server";
import { unknownRouteError, unauthorizedError } from "@middlewares/errors";
import { IResponseGeneric, errorTypes } from "@inkvisitor/shared/types/response-generic";
import "ts-jest";
import { pool } from "@middlewares/db";
import { testErroneousResponse } from "@modules/common.test";

describe("Test unknown route", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  it("should return an unknownRouteError wrapped in IResponeGeneric response", async () => {
    await authAgent
      .get(`${apiPath}/random/get`)
      .expect(unknownRouteError.statusCode())
      .expect({
        result: false,
        error: unknownRouteError.constructor.name as errorTypes,
        message: unknownRouteError.message,
      } as IResponseGeneric);
  });
});

describe("Test unauthorized request", function () {
  it("should return an unauthorizedError wrapped in IResponeGeneric response", async () => {
    await request(app)
      .get(`${apiPath}/users/122322`)
      .expect(unauthorizedError.statusCode())
      .expect(testErroneousResponse.bind(undefined, unauthorizedError));
  });
});

afterAll(async () => {
  await pool.end();
});
