import "ts-jest";
import Entity from "@models/entity/entity";
import { EntityEnums } from "@shared/enums";
import SuperordinateEntity from "./superordinate-entity";

describe("test SuperordinateEntity.validateEntities", function () {
  test("allows LOESVB - LOESVB", () => {
    const relation = new SuperordinateEntity({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Location }),
    ];

    let result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Object }),
      new Entity({ id: "2", class: EntityEnums.Class.Object }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Event }),
      new Entity({ id: "2", class: EntityEnums.Class.Event }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Statement }),
      new Entity({ id: "2", class: EntityEnums.Class.Statement }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Value }),
      new Entity({ id: "2", class: EntityEnums.Class.Value }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Being }),
      new Entity({ id: "2", class: EntityEnums.Class.Being }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();
  });

  test("allows combined L-O L-B", () => {
    const relation = new SuperordinateEntity({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Object }),
    ];

    let result = relation.validateEntities();
    expect(result).not.toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Being }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();
  });

  test("allows combined E-S S-E", () => {
    const relation = new SuperordinateEntity({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Event }),
      new Entity({ id: "2", class: EntityEnums.Class.Statement }),
    ];

    let result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Statement }),
      new Entity({ id: "2", class: EntityEnums.Class.Event }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();
  });
});
