import { IResponseGeneric } from "@shared/types";
import "mocha";
import * as chai from "chai";
import supertest from "supertest";

export const expect = chai.expect;
export const should = chai.should();

describe("common", function () {
  it("should work", () => undefined);
});

export const successfulGenericResponse: IResponseGeneric = {
  result: true,
};

export const faultyGenericResponse: IResponseGeneric = {
  result: false,
  errors: [],
};

export const testFaultyMessage = (res: supertest.Response): void => {
  res.body.should.have.keys(Object.keys(faultyGenericResponse));
  res.body.result.should.be.false;
  res.body.errors.should.be.an("array");
};
