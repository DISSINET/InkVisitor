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
  describe("validationExpansionKind", () => {
    it("sends Concept-valued fields down the superclass path", () => {
      expect(
        validationExpansionKind(
          "entityClassifications",
          EProtocolTieType.Reference
        )
      ).toBe(EValidationExpansionKind.Subclasses);
      expect(
        validationExpansionKind("propType", EProtocolTieType.Property)
      ).toBe(EValidationExpansionKind.Subclasses);
      expect(
        validationExpansionKind(
          "allowedEntities",
          EProtocolTieType.Classification
        )
      ).toBe(EValidationExpansionKind.Subclasses);
    });

    it("sends entity-valued fields down the superordinate path", () => {
      expect(
        validationExpansionKind("entitySOEs", EProtocolTieType.Property)
      ).toBe(EValidationExpansionKind.Subordinates);
      expect(
        validationExpansionKind("allowedEntities", EProtocolTieType.Reference)
      ).toBe(EValidationExpansionKind.Subordinates);
    });

    it("gives the property value list no downward path", () => {
      expect(
        validationExpansionKind("allowedEntities", EProtocolTieType.Property)
      ).toBeNull();
    });
  });

  describe("TerritoryValidation round trip", () => {
    it("keeps the expansion flags when a territory is rebuilt from a row", () => {
      const row = {
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
      };

      const rebuilt = new Territory(row as any);

      expect(rebuilt.data.validations?.[0].expansions).toEqual({
        allowedEntities: { subordinates: true },
      });
    });
  });

  describe("listValidationExpansionKeys", () => {
    it("asks for nothing when no rule has expansions", () => {
      expect(
        listValidationExpansionKeys([
          territory([
            validation({ entityClassifications: ["c1"], propType: ["p1"] }),
          ]),
        ])
      ).toEqual([]);
    });

    it("asks only for the checked box of the field that carries it", () => {
      const keys = listValidationExpansionKeys([
        territory([
          validation({
            entityClassifications: ["c1"],
            entitySOEs: ["s1"],
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

    it("follows the tie when deciding what allowedEntities means", () => {
      const asReference = listValidationExpansionKeys([
        territory([
          validation({
            tieType: EProtocolTieType.Reference,
            allowedEntities: ["r1"],
            expansions: { allowedEntities: { subordinates: true } },
          }),
        ]),
      ]);
      const asClassification = listValidationExpansionKeys([
        territory([
          validation({
            tieType: EProtocolTieType.Classification,
            allowedEntities: ["r1"],
            expansions: { allowedEntities: { subordinates: true } },
          }),
        ]),
      ]);

      expect(asReference).toEqual([
        expansionKey(EValidationExpansionKind.Subordinates, "r1"),
      ]);
      expect(asClassification).toEqual([
        expansionKey(EValidationExpansionKind.Subclasses, "r1"),
      ]);
    });

    it("skips deactivated rules and deduplicates across rules", () => {
      const keys = listValidationExpansionKeys([
        territory([
          validation({
            entityClassifications: ["c1"],
            expansions: { entityClassifications: { subordinates: true } },
          }),
          validation({
            entityClassifications: ["c1"],
            expansions: { entityClassifications: { subordinates: true } },
          }),
          validation({
            active: false,
            entityClassifications: ["c2"],
            expansions: { entityClassifications: { subordinates: true } },
          }),
        ]),
      ]);

      expect(keys).toEqual([
        expansionKey(EValidationExpansionKind.Subclasses, "c1"),
      ]);
    });
  });

  describe("expandValidationIds", () => {
    const map: ValidationExpansionMap = new Map([
      [expansionKey(EValidationExpansionKind.Subclasses, "c1"), ["c1a", "c1b"]],
      [expansionKey(EValidationExpansionKind.Equivalents, "c1"), ["c1syn"]],
      [expansionKey(EValidationExpansionKind.Subordinates, "c1"), ["c1sub"]],
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
      expect(
        expandValidationIds(
          ["c1"],
          { equivalents: false, subordinates: false },
          EValidationExpansionKind.Subclasses,
          map
        )
      ).toEqual(["c1"]);
    });

    it("keeps an empty field empty", () => {
      expect(
        expandValidationIds(
          [],
          { subordinates: true },
          EValidationExpansionKind.Subclasses,
          map
        )
      ).toEqual([]);
    });

    it("adds only the kind the field follows", () => {
      expect(
        expandValidationIds(
          ["c1"],
          { subordinates: true },
          EValidationExpansionKind.Subclasses,
          map
        ).sort()
      ).toEqual(["c1", "c1a", "c1b"]);
    });

    it("adds both sets when both boxes are checked, without duplicates", () => {
      expect(
        expandValidationIds(
          ["c1", "c1a"],
          { equivalents: true, subordinates: true },
          EValidationExpansionKind.Subclasses,
          map
        ).sort()
      ).toEqual(["c1", "c1a", "c1b", "c1syn"]);
    });

    it("keeps the picked id when nothing was collected for it", () => {
      expect(
        expandValidationIds(
          ["unknown"],
          { equivalents: true, subordinates: true },
          EValidationExpansionKind.Subordinates,
          map
        )
      ).toEqual(["unknown"]);
    });
  });

  describe("soeIdsForValidation", () => {
    it("leaves a non-Territory entity's relations alone", () => {
      const concept = {
        id: "c",
        class: EntityEnums.Class.Concept,
        data: {},
      } as IEntity;

      expect(soeIdsForValidation(concept, ["soe1"])).toEqual(["soe1"]);
    });

    it("counts a Territory's parent as a superordinate entity", () => {
      const child = {
        id: "T1",
        class: EntityEnums.Class.Territory,
        data: { parent: { territoryId: "T0", order: 0 } },
      } as ITerritory;

      expect(soeIdsForValidation(child, [])).toEqual(["T0"]);
    });

    it("leaves the root Territory alone", () => {
      const root = {
        id: "T0",
        class: EntityEnums.Class.Territory,
        data: { parent: false },
      } as ITerritory;

      expect(soeIdsForValidation(root, [])).toEqual([]);
    });
  });
});
