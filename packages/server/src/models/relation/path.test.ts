import "ts-jest";
import Superclass from "./superclass";
import Path from "./path";
import { RelationEnums } from "@shared/enums";
import { IRelationModel } from "./relation";
import Synonym from "./synonym";

describe("test Path for superclasses", () => {
  let pathInstance = new Path(RelationEnums.Type.Superclass);
  let entries: IRelationModel[] = [];

  beforeAll(async () => {
    const ab = new Superclass({ entityIds: ["A", "B"] })
    const bc = new Superclass({ entityIds: ["B", "C"] });
    const cd = new Superclass({ entityIds: ["C", "D"] });
    entries = [ab, bc, cd];
  })

  test("test Path.build", async () => {
    pathInstance.build(entries);
    expect(Object.keys(pathInstance.trees)).toHaveLength(entries.length);
  })

  test("test existing path from A->D", () => {
    expect(pathInstance.pathExists("A", "D")).toBeTruthy();
  })

  test("test existing path D -> A", () => {
    expect(pathInstance.pathExists("D", "A")).toBeFalsy();
  })
});

describe("test Path for synonyms & superclass", () => {
  let pathInstance = new Path(RelationEnums.Type.Synonym);
  let entries: IRelationModel[] = [];

  beforeAll(async () => {
    const ab = new Synonym({ entityIds: ["A", "B"] })
    const bc = new Synonym({ entityIds: ["B", "C"] });
    const cd = new Superclass({ entityIds: ["C", "D"] });
    entries = [ab, bc, cd];
  })

  test("test Path.build", async () => {
    pathInstance.build(entries);
    expect(Object.keys(pathInstance.trees)).toHaveLength(2); // only two synonyms
  })

  test("test existing path from A->D", () => {
    expect(pathInstance.pathExists("A", "D")).toBeFalsy();
  })

  test("test existing path D -> A", () => {
    expect(pathInstance.pathExists("D", "A")).toBeFalsy();
  })
});