import "ts-jest";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { ITerritory } from "@inkvisitor/shared/types";
import {
  EProtocolTieType,
  EValidationExpansionKind,
  ITerritoryValidation,
} from "@inkvisitor/shared/types/territory";

import { expansionKey } from "./validation-expansion";

jest.mock("@models/relation/functions", () => ({
  SUBORDINATE_MAX_NODES: 1000,
  getEquivalentEntityIds: jest.fn(async () => ["equivalent"]),
  getSubordinateEntityIds: jest.fn(async () => ["subordinate"]),
}));

import {
  getEquivalentEntityIds,
  getSubordinateEntityIds,
} from "@models/relation/functions";
import { buildValidationExpansionMap } from "./validation-expansion-load";

const conn = {} as any;

const territory = (validations: ITerritoryValidation[]): ITerritory =>
  ({
    id: "T0",
    class: EntityEnums.Class.Territory,
    data: { parent: false, validations },
  } as ITerritory);

const rule = (data: Partial<ITerritoryValidation>): ITerritoryValidation => ({
  tieType: EProtocolTieType.Classification,
  detail: "",
  ...data,
});

describe("models/entity/validation-expansion-load", () => {
  beforeEach(() => {
    (getEquivalentEntityIds as jest.Mock).mockClear();
    (getSubordinateEntityIds as jest.Mock).mockClear();
  });

  it("issues no query for rules without expansion flags", async () => {
    const map = await buildValidationExpansionMap(conn, [
      territory([
        rule({ entityClassifications: ["c1"], allowedEntities: ["c2"] }),
      ]),
    ]);

    expect(map.size).toBe(0);
    expect(getEquivalentEntityIds).not.toHaveBeenCalled();
    expect(getSubordinateEntityIds).not.toHaveBeenCalled();
  });

  it("walks the superclass path only for a Concept-valued field", async () => {
    await buildValidationExpansionMap(conn, [
      territory([
        rule({
          entityClassifications: ["c1"],
          expansions: { entityClassifications: { subordinates: true } },
        }),
      ]),
    ]);

    expect(getSubordinateEntityIds).toHaveBeenCalledTimes(1);
    expect(getSubordinateEntityIds).toHaveBeenCalledWith(conn, ["c1"], {
      relationTypes: [RelationEnums.Type.Superclass],
      includeChildTerritories: false,
    });
  });

  it("walks the superordinate path, territories included, for an entity-valued field", async () => {
    await buildValidationExpansionMap(conn, [
      territory([
        rule({
          tieType: EProtocolTieType.Reference,
          allowedEntities: ["r1"],
          expansions: { allowedEntities: { subordinates: true } },
        }),
      ]),
    ]);

    expect(getSubordinateEntityIds).toHaveBeenCalledWith(conn, ["r1"], {
      relationTypes: [RelationEnums.Type.SuperordinateEntity],
      includeChildTerritories: true,
    });
  });

  it("resolves each (kind, id) pair once however many rules ask for it", async () => {
    const shared = {
      entityClassifications: ["c1"],
      expansions: { entityClassifications: { subordinates: true } },
    };

    await buildValidationExpansionMap(conn, [
      territory([rule(shared), rule(shared), rule({ ...shared, detail: "x" })]),
      territory([rule(shared)]),
    ]);

    expect(getSubordinateEntityIds).toHaveBeenCalledTimes(1);
  });

  it("keys equivalents and subordinates of one entity apart", async () => {
    const map = await buildValidationExpansionMap(conn, [
      territory([
        rule({
          entityClassifications: ["c1"],
          expansions: {
            entityClassifications: { equivalents: true, subordinates: true },
          },
        }),
      ]),
    ]);

    expect(
      map.get(expansionKey(EValidationExpansionKind.Equivalents, "c1"))
    ).toEqual(["equivalent"]);
    expect(
      map.get(expansionKey(EValidationExpansionKind.Subclasses, "c1"))
    ).toEqual(["subordinate"]);
    expect(getEquivalentEntityIds).toHaveBeenCalledTimes(1);
    expect(getSubordinateEntityIds).toHaveBeenCalledTimes(1);
  });

  it("resolves every id of a long list, walking them in bounded groups", async () => {
    const ids = Array.from({ length: 25 }, (_, i) => `c${i}`);

    const map = await buildValidationExpansionMap(conn, [
      territory([
        rule({
          entityClassifications: ids,
          expansions: { entityClassifications: { subordinates: true } },
        }),
      ]),
    ]);

    expect(map.size).toBe(25);
    expect(getSubordinateEntityIds).toHaveBeenCalledTimes(25);
    for (const id of ids) {
      expect(
        map.get(expansionKey(EValidationExpansionKind.Subclasses, id))
      ).toEqual(["subordinate"]);
    }
  });

  it("skips a deactivated rule", async () => {
    await buildValidationExpansionMap(conn, [
      territory([
        rule({
          active: false,
          entityClassifications: ["c1"],
          expansions: { entityClassifications: { subordinates: true } },
        }),
      ]),
    ]);

    expect(getSubordinateEntityIds).not.toHaveBeenCalled();
  });
});
