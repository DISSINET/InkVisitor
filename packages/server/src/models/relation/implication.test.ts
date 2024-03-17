import "ts-jest";
import Entity from "@models/entity/entity";
import { EntityEnums } from "@shared/enums";
import Implication from "./implication";

describe("test Implication.validateEntities", function () {
  test("allows only [A]", () => {
    const relation = new Implication({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Action }),
      new Entity({ id: "2", class: EntityEnums.Class.Action }),
    ];

    const result = relation.validateEntities();
    expect(result).toBeNull();
  });

  test("deny anything else", () => {
    const relation = new Implication({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Location }),
    ];

    let result = relation.validateEntities();
    expect(result).not.toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Action }),
      new Entity({ id: "2", class: EntityEnums.Class.Group }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Group }),
      new Entity({ id: "2", class: EntityEnums.Class.Action }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();
  });
});
