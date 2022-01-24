import {
  createMockTree,
  createMockStatements,
  clean,
} from "@modules/common.test";
import { createActant } from "@service/shorthands";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import Territory from "@models/territory/territory";
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
  expect(res.body.territory).toEqual(mockTerritories[0]);
  expect(res.body.empty).toEqual(false);
};

const testNotEmptyFlagForPopulatedTerritory = (
  statementsTerritoryId: string,
  res: any
) => {
  const territoryWithStatements = findSubtreeInTree(
    res.body,
    statementsTerritoryId
  );

  if (territoryWithStatements) {
    expect(territoryWithStatements.empty).toEqual(false);
  } else {
    throw new Error("findSubtreeInTree returned null");
  }
};

const testEmptyFlagForPopulatedTerritory = (terId: string, res: any) => {
  const territory = findSubtreeInTree(res.body, terId);

  if (territory) {
    expect(territory.empty).toEqual(true);
  } else {
    throw new Error("findSubtreeInTree returned null");
  }
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
    expect(territoryWithStatements).not.toEqual(null);
  } else {
    expect(territoryWithStatements.statementsCount).toEqual(statements.length);
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
      expect(hasParent(mockTerritories, currentId, parentId)).toEqual(true);
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
    const randSuffix = "tree-get" + Math.random().toString();
    const territories = await createMockTree(db, randSuffix);
    const statements = await createMockStatements(db, territories);
    const statementsTerritoryId = statements[0].data.territory.id;
    const additionalEmptyTerritory = new Territory({
      id: `empty-ter--${randSuffix}`,
      data: {
        parent: {
          id: territories[0].id,
          order: 1,
        },
      },
    });
    await createActant(db, additionalEmptyTerritory);

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
      .expect(
        testNotEmptyFlagForPopulatedTerritory.bind(
          undefined,
          statementsTerritoryId
        )
      )
      .expect(
        testEmptyFlagForPopulatedTerritory.bind(
          undefined,
          additionalEmptyTerritory.id
        )
      )
      .expect(
        testCorrectPaths.bind(undefined, [
          ...territories,
          additionalEmptyTerritory,
        ])
      );

    await clean(db);
    return done();
  });
});
