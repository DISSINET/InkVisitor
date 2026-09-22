import "ts-jest";
import { EntityEnums, WarningTypeEnums } from "@inkvisitor/shared/enums";
import { IConcept, IEntity, ITerritory } from "@inkvisitor/shared/types";
import { ISetting } from "@inkvisitor/shared/types/settings";
import {
  EProtocolTieType,
  EValidationExpansionKind,
  ITerritoryValidation,
} from "@inkvisitor/shared/types/territory";

import { getEntityClass } from "@models/factory";

import Entity from "./entity";
import {
  ValidationExpansionMap,
  expansionKey,
} from "./validation-expansion";

const settings: ISetting[] = [
  WarningTypeEnums.TVEC,
  WarningTypeEnums.TVECE,
  WarningTypeEnums.TVER,
  WarningTypeEnums.TVERE,
  WarningTypeEnums.TVEP,
  WarningTypeEnums.TVEPT,
  WarningTypeEnums.TVEPV,
].map((type) => ({ id: `validation_${type}`, value: true } as ISetting));

const territoryWith = (validation: ITerritoryValidation): ITerritory =>
  ({
    id: "T0",
    class: EntityEnums.Class.Territory,
    data: { parent: false, validations: [validation] },
  } as ITerritory);

const concept = (id: string): IConcept =>
  ({ id, class: EntityEnums.Class.Concept } as IConcept);

const statement = (): Entity =>
  new Entity({ id: "S1", class: EntityEnums.Class.Statement });

const warningTypes = (
  entity: Entity,
  territory: ITerritory,
  classifications: IConcept[],
  soes: IEntity[],
  expansions?: ValidationExpansionMap
): WarningTypeEnums[] =>
  entity
    .getTBasedWarnings(
      [territory],
      classifications,
      soes,
      [],
      settings,
      expansions
    )
    .map((warning) => warning.type);

describe("models/entity getTBasedWarnings with expansions", () => {
  describe("a requirement field", () => {
    const rule = (expand: boolean): ITerritoryValidation => ({
      tieType: EProtocolTieType.Classification,
      detail: "",
      entityClasses: [EntityEnums.Class.Statement],
      allowedEntities: ["trial-statement"],
      expansions: expand
        ? { allowedEntities: { subordinates: true } }
        : undefined,
    });

    // "classified as a subclass of trial statement" - the case #2527 is about
    const subclassMap: ValidationExpansionMap = new Map([
      [
        expansionKey(EValidationExpansionKind.Subclasses, "trial-statement"),
        ["torture-statement"],
      ],
    ]);

    it("warns about a subclass while the box is unchecked", () => {
      expect(
        warningTypes(
          statement(),
          territoryWith(rule(false)),
          [concept("torture-statement")],
          [],
          subclassMap
        )
      ).toEqual([WarningTypeEnums.TVECE]);
    });

    it("accepts the subclass once the box is checked", () => {
      expect(
        warningTypes(
          statement(),
          territoryWith(rule(true)),
          [concept("torture-statement")],
          [],
          subclassMap
        )
      ).toEqual([]);
    });

    it("still warns about a concept that is not below the picked one", () => {
      expect(
        warningTypes(
          statement(),
          territoryWith(rule(true)),
          [concept("unrelated")],
          [],
          subclassMap
        )
      ).toEqual([WarningTypeEnums.TVECE]);
    });

    it("behaves as before when no expansion map is handed in", () => {
      expect(
        warningTypes(
          statement(),
          territoryWith(rule(true)),
          [concept("torture-statement")],
          []
        )
      ).toEqual([WarningTypeEnums.TVECE]);
    });
  });

  describe("a reference requirement", () => {
    const entityWithReference = (resourceId: string): Entity =>
      new Entity({
        id: "A1",
        class: EntityEnums.Class.Action,
        references: [
          { id: "ref1", resource: resourceId, value: "v1" },
        ],
      });

    const rule: ITerritoryValidation = {
      tieType: EProtocolTieType.Reference,
      detail: "",
      allowedEntities: ["wordnet"],
      expansions: { allowedEntities: { subordinates: true } },
    };

    // R WordNet 3.1 has R WordNet as its superordinate entity
    const subordinateMap: ValidationExpansionMap = new Map([
      [
        expansionKey(EValidationExpansionKind.Subordinates, "wordnet"),
        ["wordnet-3-1"],
      ],
    ]);

    it("accepts a reference to a subordinate resource", () => {
      expect(
        warningTypes(
          entityWithReference("wordnet-3-1"),
          territoryWith(rule),
          [],
          [],
          subordinateMap
        )
      ).toEqual([]);
    });

    it("warns about a resource outside the path", () => {
      expect(
        warningTypes(
          entityWithReference("geonames"),
          territoryWith(rule),
          [],
          [],
          subordinateMap
        )
      ).toEqual([WarningTypeEnums.TVERE]);
    });
  });

  describe("a condition field", () => {
    // widening a condition brings entities INTO the rule's scope, which is what
    // the issue asks for - unlike a requirement field, it can surface a warning
    // on an entity the rule did not reach before
    const rule = (expand: boolean): ITerritoryValidation => ({
      tieType: EProtocolTieType.Reference,
      detail: "",
      entityClassifications: ["animal"],
      expansions: expand
        ? { entityClassifications: { subordinates: true } }
        : undefined,
    });

    const subclassMap: ValidationExpansionMap = new Map([
      [expansionKey(EValidationExpansionKind.Subclasses, "animal"), ["dog"]],
    ]);

    it("leaves an entity classified below the condition alone while unchecked", () => {
      expect(
        warningTypes(
          statement(),
          territoryWith(rule(false)),
          [concept("dog")],
          [],
          subclassMap
        )
      ).toEqual([]);
    });

    it("applies the rule to it once checked", () => {
      expect(
        warningTypes(
          statement(),
          territoryWith(rule(true)),
          [concept("dog")],
          [],
          subclassMap
        )
      ).toEqual([WarningTypeEnums.TVER]);
    });
  });

  describe("a Territory's parent as its superordinate entity", () => {
    // built the way the callers build it, so the Territory model keeps data.parent
    const childTerritory = (id: string, parentId: string): Entity =>
      getEntityClass({
        id,
        class: EntityEnums.Class.Territory,
        data: { parent: { territoryId: parentId, order: 0 } },
      });

    const rule = (expand: boolean): ITerritoryValidation => ({
      tieType: EProtocolTieType.Reference,
      detail: "",
      entitySOEs: ["T0"],
      expansions: expand ? { entitySOEs: { subordinates: true } } : undefined,
    });

    const childTerritoriesMap: ValidationExpansionMap = new Map([
      [expansionKey(EValidationExpansionKind.Subordinates, "T0"), ["T1"]],
    ]);

    it("reaches a territory directly under the one named in the rule", () => {
      expect(
        warningTypes(
          childTerritory("T1", "T0"),
          territoryWith(rule(false)),
          [],
          []
        )
      ).toEqual([WarningTypeEnums.TVER]);
    });

    it("leaves a territory further down alone while unchecked", () => {
      expect(
        warningTypes(
          childTerritory("T2", "T1"),
          territoryWith(rule(false)),
          [],
          [],
          childTerritoriesMap
        )
      ).toEqual([]);
    });

    it("reaches it once the box is checked", () => {
      expect(
        warningTypes(
          childTerritory("T2", "T1"),
          territoryWith(rule(true)),
          [],
          [],
          childTerritoriesMap
        )
      ).toEqual([WarningTypeEnums.TVER]);
    });
  });

  describe("a property requirement", () => {
    // the entity carries one property, typed with a subclass of what the rule
    // names, and valued with a Concept
    const withProp = (typeId: string, valueId: string): Entity =>
      new Entity({
        id: "P1",
        class: EntityEnums.Class.Person,
        props: [
          {
            id: "prop1",
            children: [],
            type: { id: "t1", entityId: typeId },
            value: { id: "v1", entityId: valueId },
          },
        ],
      } as any);

    const subclassMap: ValidationExpansionMap = new Map([
      [
        expansionKey(EValidationExpansionKind.Subclasses, "date"),
        ["start-date"],
      ],
    ]);

    const rule = (
      expand: boolean,
      allowedClasses?: EntityEnums.Class[]
    ): ITerritoryValidation => ({
      tieType: EProtocolTieType.Property,
      detail: "",
      propType: ["date"],
      allowedClasses,
      expansions: expand ? { propType: { subordinates: true } } : undefined,
    });

    const check = (
      entity: Entity,
      validation: ITerritoryValidation,
      propValues: IEntity[] = [],
      expansions?: ValidationExpansionMap
    ): WarningTypeEnums[] =>
      entity
        .getTBasedWarnings(
          [territoryWith(validation)],
          [],
          [],
          propValues,
          settings,
          expansions
        )
        .map((warning) => warning.type);

    it("warns about a property typed with a subclass while unchecked", () => {
      expect(
        check(withProp("start-date", "value1"), rule(false), [], subclassMap)
      ).toEqual([WarningTypeEnums.TVEPT]);
    });

    it("accepts it once the box is checked", () => {
      expect(
        check(withProp("start-date", "value1"), rule(true), [], subclassMap)
      ).toEqual([]);
    });

    it("still warns about a property type outside the path", () => {
      expect(
        check(withProp("colour", "value1"), rule(true), [], subclassMap)
      ).toEqual([WarningTypeEnums.TVEPT]);
    });

    it("holds the value class requirement over the widened property type", () => {
      const conceptValue = [
        { id: "value1", class: EntityEnums.Class.Concept } as IEntity,
      ];
      const personValue = [
        { id: "value1", class: EntityEnums.Class.Person } as IEntity,
      ];
      const withClasses = rule(true, [EntityEnums.Class.Concept]);

      expect(
        check(
          withProp("start-date", "value1"),
          withClasses,
          conceptValue,
          subclassMap
        )
      ).toEqual([]);
      expect(
        check(
          withProp("start-date", "value1"),
          withClasses,
          personValue,
          subclassMap
        )
      ).toEqual([WarningTypeEnums.TVEPV]);
    });
  });
});
