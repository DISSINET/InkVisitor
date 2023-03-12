import "ts-jest";
import Entity from "@models/entity/entity";
import { EntityEnums } from "@shared/enums";
import Classification from "./classification";

describe("test Classification.validateEntities", function () {
  test("template in entities (valid)", () => {
    const relation = new Classification({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    const result = relation.validateEntities()
    expect(result).toBeNull();
  });

  test("template not in entities (still valid)", () => {
    const relation = new Classification({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept, isTemplate: true }),
    ];

    const result = relation.validateEntities()
    expect(result).toBeNull();
  });
});
