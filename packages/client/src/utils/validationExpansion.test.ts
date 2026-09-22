import { describe, expect, it } from "vitest";
import {
  EProtocolTieType,
  EValidationExpansionKind,
  ITerritoryValidation,
} from "@inkvisitor/shared/types/territory";

import { expansionNote, validationFieldNote } from "./validationExpansion";

const rule = (data: Partial<ITerritoryValidation>): ITerritoryValidation => ({
  tieType: EProtocolTieType.Classification,
  detail: "",
  ...data,
});

describe("utils/validationExpansion", () => {
  describe("expansionNote", () => {
    it("says nothing when the field takes only what it names", () => {
      expect(
        expansionNote(undefined, EValidationExpansionKind.Subclasses)
      ).toBe("");
      expect(
        expansionNote(
          { equivalents: false, subordinates: false },
          EValidationExpansionKind.Subclasses
        )
      ).toBe("");
    });

    it("names the path the field follows", () => {
      expect(
        expansionNote({ subordinates: true }, EValidationExpansionKind.Subclasses)
      ).toBe(" (incl. subclasses)");
      expect(
        expansionNote(
          { subordinates: true },
          EValidationExpansionKind.Subordinates
        )
      ).toBe(" (incl. subordinates)");
    });

    it("names both boxes when both are checked", () => {
      expect(
        expansionNote(
          { equivalents: true, subordinates: true },
          EValidationExpansionKind.Subordinates
        )
      ).toBe(" (incl. equivalents and subordinates)");
    });

    it("drops the downward part for a field with no path", () => {
      expect(
        expansionNote({ equivalents: true, subordinates: true }, null)
      ).toBe(" (incl. equivalents)");
    });
  });

  describe("validationFieldNote", () => {
    it("reads the tie to decide what the allowed list follows", () => {
      const flags = { allowedEntities: { subordinates: true } };

      expect(
        validationFieldNote(
          rule({
            tieType: EProtocolTieType.Reference,
            allowedEntities: ["r1"],
            expansions: flags,
          }),
          "allowedEntities"
        )
      ).toBe(" (incl. subordinates)");

      expect(
        validationFieldNote(
          rule({
            tieType: EProtocolTieType.Classification,
            allowedEntities: ["c1"],
            expansions: flags,
          }),
          "allowedEntities"
        )
      ).toBe(" (incl. subclasses)");
    });

    it("says nothing while the field holds no entity", () => {
      expect(
        validationFieldNote(
          rule({
            entityClassifications: [],
            expansions: { entityClassifications: { subordinates: true } },
          }),
          "entityClassifications"
        )
      ).toBe("");
    });

    it("says nothing for a rule saved before the boxes existed", () => {
      expect(
        validationFieldNote(
          rule({ entityClassifications: ["c1"] }),
          "entityClassifications"
        )
      ).toBe("");
    });
  });
});
