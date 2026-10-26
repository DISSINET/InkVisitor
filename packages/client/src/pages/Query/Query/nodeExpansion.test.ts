import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseEntityExpansion } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";

import { buildExpansionSection, expansionCount } from "./nodeExpansion";

const entity = (id: string): IEntity =>
  ({
    id,
    class: EntityEnums.Class.Concept,
    status: EntityEnums.Status.Approved,
    labels: [id],
  }) as IEntity;

const response = (
  overrides: Partial<IResponseEntityExpansion> = {},
): IResponseEntityExpansion => ({
  equivalents: [entity("eq-1"), entity("eq-2")],
  subordinates: [entity("sub-1")],
  totals: { equivalents: 2, subordinates: 1 },
  truncated: { equivalents: false, subordinates: false },
  ...overrides,
});

describe("expansionCount", () => {
  it("reads the true total, not the row count", () => {
    const data = response({
      equivalents: [entity("eq-1")],
      totals: { equivalents: 940, subordinates: 1 },
      truncated: { equivalents: true, subordinates: false },
    });
    expect(expansionCount(data, "equivalents")).toBe(940);
  });

  it("is undefined without data, so the badge can show a spinner", () => {
    expect(expansionCount(undefined, "equivalents")).toBeUndefined();
  });
});

describe("buildExpansionSection", () => {
  it("returns only the requested group", () => {
    const section = buildExpansionSection(response(), "equivalents");
    expect(section?.variant).toBe("equivalent");
    expect(section?.entities.map((e) => e.id)).toEqual(["eq-1", "eq-2"]);
  });

  it("never mixes the other group in", () => {
    const section = buildExpansionSection(response(), "subordinates");
    expect(section?.variant).toBe("subordinate");
    expect(section?.entities.map((e) => e.id)).toEqual(["sub-1"]);
  });

  it("is null for a group whose total is zero", () => {
    const section = buildExpansionSection(
      response({
        subordinates: [],
        totals: { equivalents: 2, subordinates: 0 },
      }),
      "subordinates",
    );
    expect(section).toBeNull();
  });

  it("labels an untruncated section with the plain total", () => {
    expect(buildExpansionSection(response(), "equivalents")?.heading).toBe(
      "equivalents (2)",
    );
  });

  it("labels a truncated section with shown-of-total", () => {
    const section = buildExpansionSection(
      response({
        equivalents: [entity("eq-1")],
        totals: { equivalents: 940, subordinates: 1 },
        truncated: { equivalents: true, subordinates: false },
      }),
      "equivalents",
    );
    expect(section?.heading).toBe("equivalents (showing 1 of 940)");
  });

  it("labels the plain total even when shown trails total, if the group was not truncated", () => {
    // a dangling relation id that no longer resolves to a live entity can
    // shrink the row count without the cap ever applying
    const section = buildExpansionSection(
      response({
        equivalents: [entity("eq-1")],
        totals: { equivalents: 2, subordinates: 1 },
        truncated: { equivalents: false, subordinates: false },
      }),
      "equivalents",
    );
    expect(section?.heading).toBe("equivalents (2)");
  });

  it("is null without data", () => {
    expect(buildExpansionSection(undefined, "equivalents")).toBeNull();
  });
});
