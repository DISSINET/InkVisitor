import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { openRestoredEntity, resolveRestoreTarget } from "./openRestoredEntity";

const asEntity = (o: object): IEntity => o as unknown as IEntity;

describe("resolveRestoreTarget", () => {
  it("routes a territory to the tree", () => {
    expect(
      resolveRestoreTarget(asEntity({ id: "T1", class: EntityEnums.Class.Territory }))
    ).toEqual({ kind: "territory", id: "T1" });
  });

  it("routes a statement to its parent territory editor", () => {
    expect(
      resolveRestoreTarget(
        asEntity({
          id: "S1",
          class: EntityEnums.Class.Statement,
          data: { territory: { territoryId: "T9" } },
        })
      )
    ).toEqual({ kind: "statement", id: "S1", territoryId: "T9" });
  });

  it("routes a statement with no parent territory to the editor without a territory", () => {
    expect(
      resolveRestoreTarget(
        asEntity({ id: "S2", class: EntityEnums.Class.Statement, data: {} })
      )
    ).toEqual({ kind: "statement", id: "S2", territoryId: undefined });
  });

  it("routes any other entity class to a detail tab", () => {
    expect(
      resolveRestoreTarget(asEntity({ id: "P1", class: EntityEnums.Class.Person }))
    ).toEqual({ kind: "detail", id: "P1" });
  });

  it("returns null for missing entity data", () => {
    expect(resolveRestoreTarget(undefined)).toBeNull();
    expect(resolveRestoreTarget(asEntity({ class: EntityEnums.Class.Person }))).toBeNull();
  });
});

describe("openRestoredEntity", () => {
  const makeNav = () => {
    const calls = {
      setTerritoryId: [] as string[],
      setStatementId: [] as string[],
      appendDetailId: [] as string[],
    };
    return {
      calls,
      nav: {
        setTerritoryId: (id: string) => calls.setTerritoryId.push(id),
        setStatementId: (id: string) => calls.setStatementId.push(id),
        appendDetailId: (id: string) => calls.appendDetailId.push(id),
      },
    };
  };

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("navigates a restored statement to its territory + editor (deferred)", async () => {
    const { calls, nav } = makeNav();
    openRestoredEntity(
      asEntity({
        id: "S1",
        class: EntityEnums.Class.Statement,
        data: { territory: { territoryId: "T9" } },
      }),
      nav
    );
    // deferred: nothing happens synchronously
    expect(calls.setStatementId).toEqual([]);
    await flush();
    expect(calls.setTerritoryId).toEqual(["T9"]);
    expect(calls.setStatementId).toEqual(["S1"]);
  });

  it("navigates a restored territory and other classes appropriately", async () => {
    const t = makeNav();
    openRestoredEntity(asEntity({ id: "T1", class: EntityEnums.Class.Territory }), t.nav);
    const p = makeNav();
    openRestoredEntity(asEntity({ id: "P1", class: EntityEnums.Class.Person }), p.nav);
    await flush();
    expect(t.calls.setTerritoryId).toEqual(["T1"]);
    expect(p.calls.appendDetailId).toEqual(["P1"]);
  });

  it("does nothing for missing entity", async () => {
    const { calls, nav } = makeNav();
    openRestoredEntity(undefined, nav);
    await flush();
    expect(calls.setTerritoryId).toEqual([]);
    expect(calls.setStatementId).toEqual([]);
    expect(calls.appendDetailId).toEqual([]);
  });
});
