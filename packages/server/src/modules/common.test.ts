import "ts-jest";
import { IActant, IAction, IResponseGeneric, IStatement } from "@shared/types";
import "ts-jest";
import { ITerritory } from "@shared/types/index";
import { Db } from "@service/RethinkDB";
import { createActant, deleteActants } from "@service/shorthands";
import Statement from "@models/statement";
import Territory from "@models/territory";
import { CustomError } from "@shared/types/errors";
import { errorTypes } from "@shared/types/response-generic";
import { ActantType } from "@shared/enums";

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

export async function createMockTree(
  db: Db,
  randSuffix: string
): Promise<ITerritory[]> {
  await deleteActants(db);
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
    await createActant(db, ter);
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
    await createActant(db, ter);
  }
  return out;
}

export async function clean(db: Db): Promise<void> {
  await deleteActants(db);

  await db.close();
}

export function mockActantData(id: string, actantType: ActantType): IActant {
  return {
    id: id,
    class: actantType,
    data: {},
    label: `label${id}`,
    detail: "",
    status: "0",
    language: "",
    notes: [],
  };
}

export function mockStatementData(id: string): IStatement {
  return {
    ...mockActantData(id, ActantType.Statement),
    class: ActantType.Statement,
    data: {
      actants: [],
      actions: [],
      modality: "",
      props: [],
      references: [],
      tags: [],
      territory: {
        id: "",
        order: 0,
      },
      text: "",
    },
  };
}
