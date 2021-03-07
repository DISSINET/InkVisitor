import {
  ActionDoesNotExits,
  BadParams,
  StatementDoesNotExits,
} from "@common/errors";
import * as chai from "chai";
import "mocha";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import {
  IActant,
  IResponseStatement,
  IResponseTree,
  IStatement,
  ITerritory,
} from "@shared/types";
import { Db } from "@service/RethinkDB";
import {
  createActant,
  deleteActant,
  findActantById,
} from "@service/shorthands";
import * as fs from "fs";
import territory from "@modules/territories";
import { expect } from "chai";

const should = chai.should();

const testValidTree = (res: any) => {
  res.body.should.not.empty;
  res.body.should.be.a("object");
  const treeExample: IResponseTree = {
    children: [],
    maxLevels: 0,
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
  };
  res.body.should.have.keys(Object.keys(treeExample));
  res.body.territory.should.have.keys(Object.keys(treeExample.territory));
};

const randSuffix = Math.random();
async function createMockTree(db: Db): Promise<ITerritory[]> {
  const out: ITerritory[] = [
    {
      id: `root-${randSuffix}`,
      class: "T",
      labels: [],
      data: {
        content: "",
        lang: "",
        parent: false,
        type: "",
      },
    },
    {
      id: `lvl1-1-${randSuffix}`,
      class: "T",
      labels: [],
      data: {
        content: "",
        lang: "",
        parent: {
          id: `root-${randSuffix}`,
          order: 1,
        },
        type: "",
      },
    },
    {
      id: `lvl1-2-${randSuffix}`,
      class: "T",
      labels: [],
      data: {
        content: "",
        lang: "",
        parent: {
          id: `root-${randSuffix}`,
          order: 2,
        },
        type: "",
      },
    },
  ];

  for (const ter of out) {
    await createActant(db, ter, true);
  }
  return out;
}

describe("Tree moveTerritory", function () {
  describe("Move lvl1-2 before lvl1-1", () => {
    it("should return a 200 code with IResponseTree success response", async (done) => {
      const db = new Db();
      await db.initDb();
      const territories = await createMockTree(db);

      await request(app)
        .post(`${apiPath}/tree/moveTerritory`)
        .send({
          moveId: `lvl1-2-${randSuffix}`,
          parentId: `root-${randSuffix}`,
          newIndex: 0,
        })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect({ result: true });

      const lvl11 = await findActantById<ITerritory>(
        db,
        `lvl1-1-${randSuffix}`
      );
      const lvl12 = await findActantById<ITerritory>(
        db,
        `lvl1-2-${randSuffix}`
      );
      expect(lvl11.data.parent ? lvl11.data.parent.id : "").to.be.eq(
        `root-${randSuffix}`
      );
      expect(lvl11.data.parent ? lvl11.data.parent.order : 0).to.not.be.eq(2);
      expect(lvl12.data.parent ? lvl12.data.parent.id : "").to.be.eq(
        `root-${randSuffix}`
      );
      expect(lvl12.data.parent ? lvl12.data.parent.order : 0).to.not.be.eq(1);
      for (const ter of territories) {
        await deleteActant(db, ter.id);
      }
      return done();
    });
  });
});
