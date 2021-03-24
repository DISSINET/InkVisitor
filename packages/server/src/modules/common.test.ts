import { IResponseGeneric, IStatement } from "@shared/types";
import "mocha";
import * as chai from "chai";
import supertest from "supertest";
import { ITerritory } from "@shared/types/index";
import { Db } from "@service/RethinkDB";
import { createActant, deleteActants } from "@service/shorthands";

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

function getRandomFromArray<T>(input: T[]): T {
  return input[Math.floor(Math.random() * input.length)];
}

export async function createMockTree(db: Db): Promise<ITerritory[]> {
  await deleteActants(db);
  const randSuffix = Math.random();
  const out: ITerritory[] = [
    {
      id: `root-${randSuffix}`,
      class: "T",
      label: "",
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
      label: "",
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
      label: "",
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

export async function createMockStatements(
  db: Db,
  territories: ITerritory[]
): Promise<IStatement[]> {
  const randSuffix = Math.random();
  const forStatement = getRandomFromArray<ITerritory>(territories).id;

  const out: IStatement[] = [];

  // create statements with territory id set
  for (let i = 0; i < 3; i++) {
    out.push({
      id: `statement-${i}-${randSuffix}`,
      class: "S",
      label: "",
      data: {
        territory: {
          id: forStatement,
          order: i + 1,
        },
        actants: [],
        action: "",
        certainty: "",
        elvl: "",
        modality: "",
        note: "",
        props: [],
        references: [],
        tags: [],
        text: "",
      },
    });
  }

  for (const ter of out) {
    await createActant(db, ter, true);
  }
  return out;
}

export async function clean(db: Db): Promise<void> {
  await deleteActants(db);
}
