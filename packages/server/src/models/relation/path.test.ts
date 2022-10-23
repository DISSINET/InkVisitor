import "ts-jest";
import { Db } from "@service/RethinkDB";
import { newMockRequest } from "@modules/common.test";
import { IRequest } from "src/custom_typings/request";
import Superclass from "./superclass";
import Path from "./path";
import { RelationEnums } from "@shared/enums";
import { deleteRelations } from "@service/shorthands";

describe("test Path", () => {
  const db = new Db();
  let request: IRequest;
  let pathInstance = new Path(RelationEnums.Type.Superclass);
  let entries = [];
  beforeAll(async () => {
    await db.initDb();
    await deleteRelations(db);
    request = newMockRequest(db);

    const ab = new Superclass({ entityIds: ["A", "B"] })
    const bc = new Superclass({ entityIds: ["B", "C"] });
    const cd = new Superclass({ entityIds: ["C", "D"] });
    entries = [ab, bc, cd];
    for (const entry of entries) {
      await entry.save(db.connection);
    }
  })

  afterAll(async () => {
    await db.close();
  })

  test("test Path.build", async () => {
    await pathInstance.build(request);
    expect(Object.keys(pathInstance.trees)).toHaveLength(entries.length);
  })

  test("test existing path from A->D", () => {
    expect(pathInstance.pathExists("A", "D")).toBeTruthy();
  })

  test("test existing path D -> A", () => {
    expect(pathInstance.pathExists("D", "A")).toBeFalsy();
  })

});