import { describe, expect, it } from "vitest";
import {
  EProtocolTieType,
  EValidationExpansionKind,
  ITerritoryValidation,
} from "@inkvisitor/shared/types/territory";

import {
  expansionNote,
  validationFieldNote,
  withExpansionFlag,
} from "./validationExpansion";

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

  describe("withExpansionFlag", () => {
    it("stores nothing for a box that is not ticked", () => {
      expect(
        withExpansionFlag(
          undefined,
          "entityClassifications",
          "subordinates",
          false
        )
      ).toBeUndefined();
    });

    it("drops the field once its last box is unticked", () => {
      expect(
        withExpansionFlag(
          {
            entityClassifications: { subordinates: true },
            propType: { equivalents: true },
          },
          "entityClassifications",
          "subordinates",
          false
        )
      ).toEqual({ propType: { equivalents: true } });
    });

    it("keeps the second box when both are ticked before the rule is saved", () => {
      // the rule comes back from the server only after the first save, so the
      // second tick has to build on what was sent, not on the stored rule
      const first = withExpansionFlag(
        undefined,
        "entityClassifications",
        "equivalents",
        true
      );
      const second = withExpansionFlag(
        first,
        "entityClassifications",
        "subordinates",
        true
      );

      expect(second).toEqual({
        entityClassifications: { equivalents: true, subordinates: true },
      });
    });

    it("leaves the other fields' boxes alone", () => {
      expect(
        withExpansionFlag(
          { entitySOEs: { subordinates: true } },
          "allowedEntities",
          "equivalents",
          true
        )
      ).toEqual({
        entitySOEs: { subordinates: true },
        allowedEntities: { equivalents: true },
      });
    });

    it("unticks one box without disturbing the other", () => {
      expect(
        withExpansionFlag(
          { propType: { equivalents: true, subordinates: true } },
          "propType",
          "equivalents",
          false
        )
      ).toEqual({ propType: { equivalents: undefined, subordinates: true } });
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
