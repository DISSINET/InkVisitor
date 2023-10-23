import { EntityEnums } from "@shared/enums";
import "ts-jest";
import { PositionRules } from "./PositionRules";

describe("models/statement/PositionRules", function () {
  test("test PositionRules.intersectRules", function () {
    // undefined rules - without intersection
    expect(PositionRules.hasIntersection([undefined, undefined])).toEqual(
      false
    );

    // no actions - should return true
    expect(PositionRules.hasIntersection([])).toEqual(true);

    // single action with single rule -> true
    expect(
      PositionRules.hasIntersection([[EntityEnums.Extension.Empty]])
    ).toEqual(true);

    // two actions both with empty
    expect(
      PositionRules.hasIntersection([
        [EntityEnums.Extension.Empty],
        [EntityEnums.Extension.Empty],
      ])
    ).toEqual(true);

    // two actions both with empty intersected
    expect(
      PositionRules.hasIntersection([
        [EntityEnums.Extension.Empty],
        [EntityEnums.Extension.Empty, EntityEnums.Class.Statement],
      ])
    ).toEqual(true);

    expect(
      PositionRules.hasIntersection([
        [EntityEnums.Class.Concept],
        [EntityEnums.Class.Concept],
      ])
    ).toEqual(true);

    expect(
      PositionRules.hasIntersection([
        [EntityEnums.Class.Concept, EntityEnums.Class.Action],
        [EntityEnums.Class.Concept, EntityEnums.Class.Action],
      ])
    ).toEqual(true);

    expect(
      PositionRules.hasIntersection([
        [EntityEnums.Class.Resource, EntityEnums.Class.Action],
        [EntityEnums.Class.Location, EntityEnums.Class.Concept],
      ])
    ).toEqual(false);

    expect(
      PositionRules.hasIntersection([
        [EntityEnums.Extension.Empty],
        [EntityEnums.Class.Action],
        [EntityEnums.Class.Location],
        [EntityEnums.Class.Concept],
        [EntityEnums.Class.Concept],
      ])
    ).toEqual(false);
  });

  test("test PositionRules.allowsOnlyEmpty", function () {
    expect(PositionRules.allowsOnlyEmpty([])).toEqual(false);
    expect(PositionRules.allowsOnlyEmpty(undefined)).toEqual(false);
    expect(PositionRules.allowsOnlyEmpty([EntityEnums.Class.Concept])).toEqual(
      false
    );
    expect(
      PositionRules.allowsOnlyEmpty([
        EntityEnums.Class.Concept,
        EntityEnums.Extension.Empty,
      ])
    ).toEqual(false);
    expect(
      PositionRules.allowsOnlyEmpty([EntityEnums.Extension.Empty])
    ).toEqual(true);
  });
});
