import { IResponseGeneric, IStatement } from "@shared/types";
import "mocha";
import * as chai from "chai";
import supertest from "supertest";
import { ITerritory } from "@shared/types/index";
import { Db } from "@service/RethinkDB";
import { createActant, deleteActants } from "@service/shorthands";
import Statement from "@models/statement";
import Territory from "@models/territory";

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
  error: "InternalServerError",
};

export const testFaultyMessage = (res: supertest.Response): void => {
  res.body.should.have.keys(Object.keys(faultyGenericResponse));
  res.body.result.should.be.false;
  res.body.errors.should.be.an("array");
};

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
  const forStatement = getRandomFromArray<ITerritory>(territories).id;

  const out: Statement[] = [];

  // create statements with territory id set
  for (let i = 0; i < 3; i++) {
    out.push(
      new Statement({
        id: `statement-${i}-${randSuffix}`,
        data: {
          territory: {
            id: forStatement,
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
