import "ts-jest";
import Entity from "@models/entity/entity";
import { EntityEnums } from "@shared/enums";
import Classification from "./classification";
import { ModelNotValidError } from "@shared/types/errors";

describe("test Classification.validateEntities", function () {
  test("template -> non template", () => {
    const relation = new Classification({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person, isTemplate: true }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    const result = relation.validateEntities()
    expect(result).toBeNull();
  });

  test("non template -> template", () => {
    const relation = new Classification({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept, isTemplate: true }),
    ];

    const result = relation.validateEntities()
    expect(result).toBeInstanceOf(ModelNotValidError);
    expect(result?.message).toContain("must not be a template");
  });



  test("non template -> non template", () => {
    const relation = new Classification({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    const result = relation.validateEntities()
    expect(result).toBeNull();
  });

});
