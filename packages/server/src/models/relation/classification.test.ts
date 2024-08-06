import "ts-jest";
import Entity from "@models/entity/entity";
import { EntityEnums } from "@shared/enums";
import Classification from "./classification";
import { ModelNotValidError } from "@shared/types/errors";

describe("test Classification.validateEntities", function () {
  test("template -> non template", () => {
    const relation = new Classification({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({
        id: "1",
        class: EntityEnums.Class.Person,
        isTemplate: true,
      }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    const result = relation.validateEntities();
    expect(result).toBeNull();
  });

  test("non template -> template", () => {
    const relation = new Classification({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({
        id: "2",
        class: EntityEnums.Class.Concept,
        isTemplate: true,
      }),
    ];

    const result = relation.validateEntities();
    expect(result).toBeInstanceOf(ModelNotValidError);
    expect(result?.message).toContain("must not be a template");
  });

  test("non template -> non template", () => {
    const relation = new Classification({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    const result = relation.validateEntities();
    expect(result).toBeNull();
  });

  test("allows PLOGESTRBV-C", () => {
    const relation = new Classification({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    let result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Object }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Group }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Event }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Statement }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Territory }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Resource }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Being }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Value }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();
  });

  test("deny not PLOGESTRBV-C", () => {
    const relation = new Classification({ entityIds: ["1", "2"] });
    // not allowed C-C
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Concept }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    let result = relation.validateEntities();
    expect(result).not.toBeNull();

    // not allowed A-C
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Action }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();

    // not allowed P-L
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({ id: "2", class: EntityEnums.Class.Location }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();

    // inverted
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Concept }),
      new Entity({ id: "2", class: EntityEnums.Class.Group }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();
  });
});
