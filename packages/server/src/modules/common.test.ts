import Acl from "@middlewares/acl";
import "@models/events/register";
import Statement, { StatementData } from "@models/statement/statement";
import Territory from "@models/territory/territory";
import User from "@models/user/user";
import { Db } from "@service/RethinkDB";
import {
  createEntity,
  deleteAudits,
  deleteEntities,
  deleteRelations,
} from "@service/shorthands";
import { EntityEnums } from "@shared/enums";
import { IResponseGeneric, IStatement, IStatementAction } from "@shared/types";
import { CustomError } from "@shared/types/errors";
import { ITerritory } from "@shared/types/index";
import { errorTypes } from "@shared/types/response-generic";
import { IRequest } from "src/custom_typings/request";
import "ts-jest";

describe("common", function () {
  it("should work", () => undefined);
});

export const successfulGenericResponse: IResponseGeneric = {
  result: true,
};

export const newMockRequest = (db: Db): IRequest => {
  return {
    acl: new Acl(),
    db: db,
    user: undefined,
    getUserOrFail: () => {
      return new User({});
    },
    baseUrl: "",
    method: "GET",
    route: { path: "/" },
    params: {},
    body: {},
    query: {},
  };
};

export function testErroneousResponse(
  expectedErrorClass: CustomError,
  res: Response
): void {
  const expectedType: IResponseGeneric = {
    result: false,
    error: expectedErrorClass.constructor.name as errorTypes,
    message: "",
  };
  expect(res.status).toEqual(expectedErrorClass.statusCode());
  expect(typeof res.body).toEqual("object");
  expect((res.body as any).result).toEqual(expectedType.result);
  expect((res.body as any).error).toEqual(expectedType.error);
}

function getRandomFromArray<T>(input: T[]): T {
  return input[Math.floor(Math.random() * input.length)];
}

export function getITerritoryMock(): ITerritory {
  return {
    status: EntityEnums.Status.Approved,
    id: "id",
    detail: "detail",
    language: EntityEnums.Language.Latin,
    notes: [],
    label: "label",
    data: {
      parent: false,
    },
    props: [],
    class: EntityEnums.Class.Territory,
    references: [],
  };
}

export function getIStatementActionMock(): IStatementAction {
  return {
    actionId: "action",
    bundleEnd: false,
    bundleStart: false,
    certainty: EntityEnums.Certainty.Empty,
    elvl: EntityEnums.Elvl.Inferential,
    id: "action",
    logic: EntityEnums.Logic.Positive,
    mood: [EntityEnums.Mood.Ability],
    moodvariant: EntityEnums.MoodVariant.Irrealis,
    bundleOperator: EntityEnums.Operator.And,
    props: [],
  };
}

export function getIStatementMock(): IStatement {
  return {
    id: "id",
    class: EntityEnums.Class.Statement,
    label: "label",
    data: {
      actions: [],
      actants: [],
      tags: [],
      territory: {
        territoryId: "id",
        order: 0,
      },
      text: "text",
    },
    props: [],
    detail: "",
    language: EntityEnums.Language.Czech,
    notes: [],
    status: EntityEnums.Status.Approved,
    references: [],
  };
}

export async function createMockTree(
  db: Db,
  randSuffix: string
): Promise<ITerritory[]> {
  await deleteEntities(db);
  const out: Territory[] = [
    new Territory({
      id: `root-${randSuffix}`,
    }),
    new Territory({
      id: `lvl1-1-${randSuffix}`,
      data: {
        parent: {
          territoryId: `root-${randSuffix}`,
          order: 1,
        },
      },
    }),
    new Territory({
      id: `lvl1-2-${randSuffix}`,
      data: {
        parent: {
          territoryId: `root-${randSuffix}`,
          order: 2,
        },
      },
    }),
  ];

  for (const ter of out) {
    await createEntity(db, ter);
  }
  return out;
}

export async function createMockStatements(
  db: Db,
  territories: ITerritory[]
): Promise<IStatement[]> {
  const randSuffix = Math.random();
  const chosenTerritory = getRandomFromArray<ITerritory>(territories).id;

  const out: Statement[] = [];

  // create statements with territory id set
  for (let i = 0; i < 3; i++) {
    const stat = new Statement({
      id: `statement-${i}-${randSuffix}`,
    });
    stat.data = new StatementData({
      territory: {
        territoryId: chosenTerritory,
        order: i + 1,
      },
    });
    out.push(stat);
  }

  for (const ter of out) {
    await createEntity(db, ter);
  }
  return out;
}

export async function clean(db: Db): Promise<void> {
  await deleteEntities(db);
  await deleteAudits(db);
  await deleteRelations(db);
  await db.close();
}
