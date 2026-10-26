import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { UserOptions } from "@inkvisitor/shared/types/response-user";
import { describe, expect, it } from "vitest";
import { buildValueCopy, canCreateEntities, copiesDroppedValue } from "./valueDropCopy";

const userOptions = {
  defaultLanguage: EntityEnums.Language.Latin,
} as UserOptions;

const sourceValue = {
  id: "V-source",
  class: EntityEnums.Class.Value,
  labels: ["40", "forty"],
  detail: "a detail that must not travel",
  language: EntityEnums.Language.English,
  data: {},
  props: [{ id: "P1" }],
  references: [{ id: "R1" }],
  notes: ["a note"],
  status: EntityEnums.Status.Approved,
  isTemplate: false,
} as unknown as IEntity;

describe("copiesDroppedValue", () => {
  const base = {
    entityClass: EntityEnums.Class.Value,
    categoryTypes: [EntityEnums.Class.Value],
    canCreate: true,
  };

  it("copies a V dropped on a target that stores Values", () => {
    expect(copiesDroppedValue(base)).toBe(true);
  });

  it("leaves other classes alone", () => {
    expect(copiesDroppedValue({ ...base, entityClass: EntityEnums.Class.Concept })).toBe(false);
  });

  it("does not copy where the target does not accept Values", () => {
    expect(copiesDroppedValue({ ...base, categoryTypes: [EntityEnums.Class.Concept] })).toBe(false);
  });

  it("does not copy on a lookup target", () => {
    expect(copiesDroppedValue({ ...base, reuseDroppedValue: true })).toBe(false);
  });

  it("does not copy where the user may not create entities", () => {
    expect(copiesDroppedValue({ ...base, canCreate: false })).toBe(false);
  });
});

describe("canCreateEntities", () => {
  it("allows an editor", () => {
    expect(canCreateEntities(UserEnums.Role.Editor)).toBe(true);
  });

  it("refuses a viewer", () => {
    expect(canCreateEntities(UserEnums.Role.Viewer)).toBe(false);
  });

  it("refuses an unknown role", () => {
    expect(canCreateEntities(null)).toBe(false);
  });

  it("refuses a target that disables creation", () => {
    expect(canCreateEntities(UserEnums.Role.Editor, true)).toBe(false);
  });
});

describe("buildValueCopy", () => {
  it("carries the labels and nothing else", () => {
    const copy = buildValueCopy(sourceValue, userOptions);

    expect(copy.labels).toEqual(["40", "forty"]);
    expect(copy.class).toBe(EntityEnums.Class.Value);
    expect(copy.detail).toBe("");
    expect(copy.language).toBe(EntityEnums.Language.Latin);
    expect(copy.status).toBe(EntityEnums.Status.Approved);
    expect(copy.props).toEqual([]);
    expect(copy.references).toEqual([]);
    expect(copy.notes).toEqual([]);
    expect(copy.isTemplate).toBe(false);
  });

  it("gives the copy its own id", () => {
    const first = buildValueCopy(sourceValue, userOptions);
    const second = buildValueCopy(sourceValue, userOptions);

    expect(first.id).not.toBe(sourceValue.id);
    expect(first.id).not.toBe(second.id);
  });

  it("keeps an unlabelled source unlabelled rather than dropping to no label at all", () => {
    const copy = buildValueCopy({ ...sourceValue, labels: [] } as unknown as IEntity, userOptions);

    expect(copy.labels).toEqual([""]);
  });
});
