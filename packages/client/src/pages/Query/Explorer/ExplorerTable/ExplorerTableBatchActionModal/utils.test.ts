import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { describe, expect, it } from "vitest";
import { batchAttributeChangeNote, relationTargetClasses } from "./utils";

describe("batchAttributeChangeNote", () => {
  it("names how many entities already hold the target", () => {
    expect(batchAttributeChangeNote(3, false)).toEqual(" (3 already have that value)");
    expect(batchAttributeChangeNote(1, false)).toEqual(" (1 already has that value)");
  });

  it("notes the untouched rest", () => {
    expect(batchAttributeChangeNote(0, true)).toEqual(" (the rest stay untouched)");
  });

  it("joins both in one bracket", () => {
    expect(batchAttributeChangeNote(3, true)).toEqual(
      " (3 already have that value, the rest stay untouched)"
    );
  });

  it("is empty when neither applies", () => {
    expect(batchAttributeChangeNote(0, false)).toEqual("");
  });
});

describe("relationTargetClasses", () => {
  it("lists the target classes the relation rule allows", () => {
    expect(relationTargetClasses(RelationEnums.Type.Classification)).toEqual([
      EntityEnums.Class.Concept,
    ]);
  });

  it("allows every class, Concept and Action included, when the rule has no pattern", () => {
    const classes = relationTargetClasses(RelationEnums.Type.Related);
    expect(classes).toEqual(entitiesDict.map((e) => e.value));
    expect(classes).toContain(EntityEnums.Class.Concept);
    expect(classes).toContain(EntityEnums.Class.Action);
  });

  it("keeps the person-to-value classes when the type is missing", () => {
    expect(relationTargetClasses(undefined)).toEqual(EntityEnums.PLOGESTRBV);
  });
});
