import "ts-jest";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, ITerritory } from "@inkvisitor/shared/types";
import {
  EProtocolTieType,
  EValidationExpansionKind,
  ITerritoryValidation,
  validationExpansionKind,
} from "@inkvisitor/shared/types/territory";
import Territory from "@models/territory/territory";

import {
  ValidationExpansionMap,
  expandValidationIds,
  expansionKey,
  listValidationExpansionKeys,
  soeIdsForValidation,
} from "./validation-expansion";

const validation = (
  data: Partial<ITerritoryValidation>
): ITerritoryValidation => ({
  tieType: EProtocolTieType.Property,
  detail: "",
  ...data,
});

const territory = (validations: ITerritoryValidation[]): ITerritory =>
  ({
    id: "T",
    class: EntityEnums.Class.Territory,
    data: { parent: false, validations },
  } as ITerritory);

describe("models/entity/validation-expansion", () => {
  it("sends each field down the path it stands for", () => {
    const { Subclasses, Subordinates } = EValidationExpansionKind;

    expect(
      validationExpansionKind("entityClassifications", EProtocolTieType.Property)
    ).toBe(Subclasses);
    expect(validationExpansionKind("propType", EProtocolTieType.Property)).toBe(
      Subclasses
    );
    expect(
      validationExpansionKind("entitySOEs", EProtocolTieType.Property)
    ).toBe(Subordinates);
    // the allowed list changes meaning with the tie
    expect(
      validationExpansionKind("allowedEntities", EProtocolTieType.Classification)
    ).toBe(Subclasses);
    expect(
      validationExpansionKind("allowedEntities", EProtocolTieType.Reference)
    ).toBe(Subordinates);
    // the property value list carries no boxes
    expect(
      validationExpansionKind("allowedEntities", EProtocolTieType.Property)
    ).toBeNull();
  });

  describe("listValidationExpansionKeys", () => {
    it("asks for the box that was checked, on the field that carries it", () => {
      const keys = listValidationExpansionKeys([
        territory([
          validation({
            entityClassifications: ["c1"],
            entitySOEs: ["s1"],
            propType: ["p1"],
            expansions: {
              entityClassifications: { subordinates: true },
              entitySOEs: { equivalents: true },
            },
          }),
        ]),
      ]);

      expect(keys.sort()).toEqual(
        [
          expansionKey(EValidationExpansionKind.Subclasses, "c1"),
          expansionKey(EValidationExpansionKind.Equivalents, "s1"),
        ].sort()
      );
    });

    it("asks nothing for rules without flags or for deactivated ones, and asks once per pair", () => {
      const flagged = {
        entityClassifications: ["c1"],
        expansions: { entityClassifications: { subordinates: true } },
      };

      expect(
        listValidationExpansionKeys([
          territory([
            validation(flagged),
            validation(flagged),
            validation({ ...flagged, active: false }),
            validation({ entityClassifications: ["c2"] }),
          ]),
        ])
      ).toEqual([expansionKey(EValidationExpansionKind.Subclasses, "c1")]);
    });
  });

  describe("expandValidationIds", () => {
    const map: ValidationExpansionMap = new Map([
      [expansionKey(EValidationExpansionKind.Subclasses, "c1"), ["c1a", "c1b"]],
      [expansionKey(EValidationExpansionKind.Equivalents, "c1"), ["c1syn"]],
    ]);

    it("returns the picked ids untouched when no box is checked", () => {
      expect(
        expandValidationIds(
          ["c1"],
          undefined,
          EValidationExpansionKind.Subclasses,
          map
        )
      ).toEqual(["c1"]);
      // an empty field stays empty, so "no condition set" stays readable
      expect(
        expandValidationIds(
          [],
          { subordinates: true },
          EValidationExpansionKind.Subclasses,
          map
        )
      ).toEqual([]);
    });

    it("adds what each checked box collected, without duplicates, keeping the picked ids", () => {
      expect(
        expandValidationIds(
          ["c1", "c1a", "unknown"],
          { equivalents: true, subordinates: true },
          EValidationExpansionKind.Subclasses,
          map
        ).sort()
      ).toEqual(["c1", "c1a", "c1b", "c1syn", "unknown"]);
    });
  });

  it("counts a Territory's parent as a superordinate entity", () => {
    const child = {
      id: "T1",
      class: EntityEnums.Class.Territory,
      data: { parent: { territoryId: "T0", order: 0 } },
    } as ITerritory;
    const root = {
      id: "T0",
      class: EntityEnums.Class.Territory,
      data: { parent: false },
    } as ITerritory;
    const concept = { id: "c", class: EntityEnums.Class.Concept } as IEntity;

    expect(soeIdsForValidation(child, ["soe1"])).toEqual(["soe1", "T0"]);
    expect(soeIdsForValidation(root, [])).toEqual([]);
    expect(soeIdsForValidation(concept, ["soe1"])).toEqual(["soe1"]);
  });

  it("keeps the flags when a territory is rebuilt from a database row", () => {
    const rebuilt = new Territory({
      id: "T1",
      class: EntityEnums.Class.Territory,
      data: {
        parent: { territoryId: "T0", order: 0 },
        validations: [
          {
            tieType: EProtocolTieType.Reference,
            detail: "",
            allowedEntities: ["r1"],
            expansions: { allowedEntities: { subordinates: true } },
          },
        ],
      },
    } as any);

    expect(rebuilt.data.validations?.[0].expansions).toEqual({
      allowedEntities: { subordinates: true },
    });
  });
});
