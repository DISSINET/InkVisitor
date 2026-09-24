import { describe, expect, it } from "vitest";
import {
  EProtocolTieType,
  EValidationExpansionKind,
  ITerritoryValidation,
} from "@inkvisitor/shared/types/territory";

import {
  expansionNote,
  sameExpansions,
  validationFieldNote,
  withExpansionFlag,
} from "./validationExpansion";

const rule = (data: Partial<ITerritoryValidation>): ITerritoryValidation => ({
  tieType: EProtocolTieType.Classification,
  detail: "",
  ...data,
});

describe("utils/validationExpansion", () => {
  it("names each checked box, and says nothing when none is", () => {
    expect(expansionNote(undefined, EValidationExpansionKind.Subclasses)).toBe(
      ""
    );
    expect(
      expansionNote({ subordinates: true }, EValidationExpansionKind.Subclasses)
    ).toBe(" (incl. subclasses)");
    expect(
      expansionNote(
        { equivalents: true, subordinates: true },
        EValidationExpansionKind.Subordinates
      )
    ).toBe(" (incl. equivalents and subordinates)");
  });

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

  it("says nothing about a field that holds no entity", () => {
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

  it("keeps the second box when both are ticked before the rule is saved", () => {
    // the rule comes back from the server only after the first save, so the
    // second tick has to build on what was sent, not on the stored rule
    const first = withExpansionFlag(
      undefined,
      "entityClassifications",
      "equivalents",
      true
    );

    expect(
      withExpansionFlag(first, "entityClassifications", "subordinates", true)
    ).toEqual({
      entityClassifications: { equivalents: true, subordinates: true },
    });
  });

  it("leaves nothing behind once the last box of a field is unticked", () => {
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
    expect(
      withExpansionFlag(
        { propType: { equivalents: true } },
        "propType",
        "equivalents",
        false
      )
    ).toBeUndefined();
  });

  it("sees a saved rule as matching what was sent despite dropped undefined keys", () => {
    // what is sent carries unticked flags as undefined; the saved rule does not
    expect(
      sameExpansions(
        { propType: { equivalents: true, subordinates: undefined } },
        { propType: { equivalents: true } }
      )
    ).toBe(true);
    expect(sameExpansions({}, undefined)).toBe(true);
    expect(
      sameExpansions(
        { propType: { equivalents: true }, entitySOEs: { subordinates: true } },
        { entitySOEs: { subordinates: true }, propType: { equivalents: true } }
      )
    ).toBe(true);
  });

  it("tells an intermediate save apart from the flags last sent", () => {
    expect(
      sameExpansions(
        { entityClassifications: { equivalents: true, subordinates: true } },
        { entityClassifications: { equivalents: true } }
      )
    ).toBe(false);
    expect(
      sameExpansions(
        { entitySOEs: { equivalents: true } },
        { entityClassifications: { equivalents: true } }
      )
    ).toBe(false);
  });
});
