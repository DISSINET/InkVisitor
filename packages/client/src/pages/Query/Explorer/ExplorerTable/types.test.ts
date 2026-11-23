import { RelationEnums } from "@inkvisitor/shared/enums";
import { Explore } from "@inkvisitor/shared/types/query";
import { describe, expect, it } from "vitest";
import { BatchAction, batchOptions, isBatchActionOffered, isReadOnlyColumn } from "./types";

describe("isReadOnlyColumn", () => {
  it("a forward relation column can be edited", () => {
    expect(
      isReadOnlyColumn({
        type: Explore.EExploreColumnType.ER,
        params: { relationType: RelationEnums.Type.Superclass },
      }),
    ).toBe(false);
  });

  it("an inverse relation column is read-only", () => {
    expect(
      isReadOnlyColumn({
        type: Explore.EExploreColumnType.ER,
        params: { relationType: RelationEnums.Type.Superclass, inverse: true },
      }),
    ).toBe(true);
  });

  it("read-only column types stay read-only", () => {
    expect(isReadOnlyColumn({ type: Explore.EExploreColumnType.ECL, params: {} })).toBe(true);
  });
});

describe("isBatchActionOffered", () => {
  const none = { canBatchEdit: false, canBatchReplace: false };
  const editor = { canBatchEdit: false, canBatchReplace: true };
  const admin = { canBatchEdit: true, canBatchReplace: true };

  it("replace relation is offered to editors and admins, not to a viewer or an unloaded role", () => {
    expect(isBatchActionOffered(BatchAction.replace_relation, none)).toBe(false);
    expect(isBatchActionOffered(BatchAction.replace_relation, editor)).toBe(true);
    expect(isBatchActionOffered(BatchAction.replace_relation, admin)).toBe(true);
  });

  it("admin-only actions stay hidden from editors", () => {
    expect(isBatchActionOffered(BatchAction.add_relation, editor)).toBe(false);
    expect(isBatchActionOffered(BatchAction.add_relation, admin)).toBe(true);
  });

  it("actions for everyone are always offered", () => {
    expect(isBatchActionOffered(BatchAction.open_in_detail, none)).toBe(true);
  });

  it("replace relation is listed in the menu", () => {
    expect(batchOptions.map((o) => o.value)).toContain(BatchAction.replace_relation);
  });

  it("replace metaproperty is offered to editors and admins, listed right after replace relation", () => {
    expect(isBatchActionOffered(BatchAction.replace_metaprop, none)).toBe(false);
    expect(isBatchActionOffered(BatchAction.replace_metaprop, editor)).toBe(true);
    expect(isBatchActionOffered(BatchAction.replace_metaprop, admin)).toBe(true);
    const values = batchOptions.map((o) => o.value);
    expect(values.indexOf(BatchAction.replace_metaprop)).toBe(
      values.indexOf(BatchAction.replace_relation) + 1
    );
    expect(batchOptions.find((o) => o.value === BatchAction.replace_metaprop)?.label).toBe(
      "replace metaproperty"
    );
  });
});
