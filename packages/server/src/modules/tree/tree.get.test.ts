import {
  expect,
  createMockTree,
  createMockStatements,
  clean,
} from "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { IResponseTree, IStatement, ITerritory } from "@shared/types";
import { Db } from "@service/RethinkDB";

const findSubtreeInTree = (
  territories: IResponseTree,
  wantedId: string
): IResponseTree | null => {
  if (territories.territory.id === wantedId) {
    return territories;
  }

  for (const child of territories.children) {
    const result = findSubtreeInTree(child, wantedId);
    if (result) {
      return result;
    }
  }

  return null;
};

const testCorrectRootTerritory = (mockTerritories: ITerritory[], res: any) => {
  expect(res.body.territory).to.be.deep.eq(mockTerritories[0]);
};

const testCorrectStatementsCount = (
  statementsTerritoryId: string,
  statements: IStatement[],
  res: any
) => {
  const territoryWithStatements = findSubtreeInTree(
    res.body,
    statementsTerritoryId
  );
  if (!territoryWithStatements) {
    expect(territoryWithStatements).to.be.not.eq(null);
  } else {
    expect(territoryWithStatements.statementsCount).to.be.eq(statements.length);
  }
};

const hasParent = (
  mockTerritories: ITerritory[],
  childId: string,
  parentId: string
): boolean => {
  const child = mockTerritories.find((t) => t.id === childId);
  if (child) {
    return child.data.parent && child.data.parent.id === parentId;
  }
  return false;
};

const testCorrectPaths = (mockTerritories: ITerritory[], res: any) => {
  (function testPath(rootTree: IResponseTree) {
    let currentId = rootTree.territory.id;
    for (const parentId of rootTree.path) {
      expect(hasParent(mockTerritories, currentId, parentId)).to.be.eq(true);
      currentId = parentId;
    }
    for (const child of rootTree.children) {
      testPath(child);
    }
  })(res.body);
};

describe("Tree get", function () {
  it("should return a 200 code with IResponseTree response", async (done) => {
    const db = new Db();
    await db.initDb();

    const territories = await createMockTree(db);
    const statements = await createMockStatements(db, territories);
    const statementsTerritoryId = statements[0].data.territory.id;

    await request(app)
      .get(`${apiPath}/tree/get`)
      .set("authorization", "Bearer " + supertestConfig.token)
      .expect(200)
      .expect(testCorrectRootTerritory.bind(undefined, territories))
      .expect(
        testCorrectStatementsCount.bind(
          undefined,
          statementsTerritoryId,
          statements
        )
      )
      .expect(testCorrectPaths.bind(undefined, territories));

    await clean(db);
    return done();
  });
});
