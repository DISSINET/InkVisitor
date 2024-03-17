import "ts-jest";
import Entity from "@models/entity/entity";
import { ModelNotValidError } from "@shared/types/errors";
import { EntityEnums } from "@shared/enums";
import Related from "./related";

describe("test Related.validateEntities", function () {
  test("template in PLOGESTRB entities (valid)", () => {
    const relation = new Related({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({
        id: "2",
        class: EntityEnums.Class.Location,
        isTemplate: true,
      }),
    ];

    const result = relation.validateEntities();
    expect(result).toBeNull();
  });

  test("template in NOT PLOGESTRB entities (invalid)", () => {
    const relation = new Related({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({
        id: "2",
        class: EntityEnums.Class.Action,
        isTemplate: true,
      }),
    ];

    const result = relation.validateEntities();
    expect(result).toBeInstanceOf(ModelNotValidError);
    expect(result?.message).toContain("must not be a template");
  });
});

describe("test Related.validateEntities", function () {
  test("allow [A], [C]...", () => {
    const relation = new Related({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Action }),
      new Entity({ id: "2", class: EntityEnums.Class.Action }),
    ];

    let result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Concept }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();
  });

  test("allow AC, CA, LG, VL...", () => {
    const relation = new Related({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Action }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    let result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Concept }),
      new Entity({ id: "2", class: EntityEnums.Class.Action }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Group }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Value }),
      new Entity({ id: "2", class: EntityEnums.Class.Location }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();
  });
});
