import "ts-jest";
import { IResponseGeneric, IStatement } from "@shared/types";
import { ITerritory } from "@shared/types/index";
import { Db } from "@service/RethinkDB";
import { createActant, deleteActants } from "@service/shorthands";
import Statement from "@models/statement";
import Territory from "@models/territory";
import { CustomError } from "@shared/types/errors";
import { errorTypes } from "@shared/types/response-generic";

describe("common", function () {
  it("should work", () => undefined);
});

function getRandomFromArray<T>(input: T[]): T {
  return input[Math.floor(Math.random() * input.length)];
}

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
  };
  expect(res.status).toEqual(expectedErrorClass.statusCode());
  expect(res.body).toMatchObject(expectedType);
  expect((res.body as unknown as IResponseGeneric).result).toEqual(
    expectedType.result
  );
  expect((res.body as unknown as IResponseGeneric).error).toEqual(
    expectedType.error
  );
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
