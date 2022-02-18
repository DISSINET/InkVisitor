import Audit from "@models/audit/audit";
import "@models/events/register";
import Statement from "@models/statement/statement";
import Territory from "@models/territory/territory";
import { Db } from "@service/RethinkDB";
import { createEntity, deleteEntities } from "@service/shorthands";
import {
  Certainty,
  Elvl,
  EntityClass,
  Language,
  Logic,
  Mood,
  MoodVariant,
  Operator,
} from "@shared/enums";
import { IResponseGeneric, IStatement, IStatementAction } from "@shared/types";
import { CustomError } from "@shared/types/errors";
import { ITerritory } from "@shared/types/index";
import { errorTypes } from "@shared/types/response-generic";
import { r as rethink } from "rethinkdb-ts";
import "ts-jest";

describe("common", function () {
  it("should work", () => undefined);
});

export const successfulGenericResponse: IResponseGeneric = {
  result: true,
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
  const fullData: ITerritory = {
    id: "id",
    detail: "detail",
    language: Language.Latin,
    notes: [],
    label: "label",
    data: {
      parent: false,
    },
    props: [],
    class: EntityClass.Territory,
  };

  return fullData;
}

export function getIStatementActionMock(): IStatementAction {
  return {
    action: "action",
    bundleEnd: false,
    bundleStart: false,
    certainty: Certainty.Empty,
    elvl: Elvl.Inferential,
    id: "action",
    logic: Logic.Positive,
    mood: [Mood.Ability],
    moodvariant: MoodVariant.Irrealis,
    bundleOperator: Operator.And,
  } as IStatementAction;
}

export function getIStatementMock(): IStatement {
  const fullData: IStatement = {
    id: "id",
    class: EntityClass.Statement,
    label: "label",
    data: {
      actions: [],
      actants: [],
      references: [],
      tags: [],
      territory: {
        id: "id",
        order: 0,
      },
      text: "text",
    },
    props: [],
    detail: "",
    language: Language.Czech,
    notes: [],
  };
  return fullData;
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
          id: `root-${randSuffix}`,
          order: 1,
        },
      },
    }),
    new Territory({
      id: `lvl1-2-${randSuffix}`,
      data: {
        parent: {
          id: `root-${randSuffix}`,
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
    out.push(
      new Statement({
        id: `statement-${i}-${randSuffix}`,
        data: {
          territory: {
            id: chosenTerritory,
            order: i + 1,
          },
        },
      })
    );
  }

  for (const ter of out) {
    await createEntity(db, ter);
  }
  return out;
}

export async function clean(db: Db): Promise<void> {
  await deleteEntities(db);

  await db.close();
}

export async function clearAudits(db: Db): Promise<void> {
  await rethink.table(Audit.table).delete().run(db.connection);
  await db.close();
}
