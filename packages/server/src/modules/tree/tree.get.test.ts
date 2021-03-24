import "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { IResponseTree } from "@shared/types";

const testValidTree = (res: any) => {
  res.body.should.not.empty;
  res.body.should.be.a("object");
  const treeExample: IResponseTree = {
    children: [],
    lvl: 0,
    statementsCount: 0,
    territory: {
      id: "",
      class: "T",
      data: {
        content: "",
        lang: "",
        parent: false,
        type: "",
      },
      labels: [],
    },
    path: [],
  };
  res.body.should.have.keys(Object.keys(treeExample));
  res.body.territory.should.have.keys(Object.keys(treeExample.territory));
};

describe("Tree get", function () {
  describe("Correct param", () => {
    it("should return a 200 code with IResponseTree response", (done) => {
      return request(app)
        .get(`${apiPath}/tree/get`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect(testValidTree)
        .then(() => done());
    });
  });
});
