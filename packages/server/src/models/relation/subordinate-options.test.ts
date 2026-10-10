import "ts-jest";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import Entity from "@models/entity/entity";
import Territory from "@models/territory/territory";

import Relation from "./relation";
import { getSubordinateEntityIds } from "./functions";

const conn = {} as any;

const findForEntities = jest.spyOn(Relation, "findForEntities");
const findEntitiesByIds = jest.spyOn(Entity, "findEntitiesByIds");
const findChilds = jest.spyOn(Territory.prototype, "findChilds");

describe("models/relation/functions getSubordinateEntityIds options", () => {
  beforeEach(() => {
    findForEntities.mockReset().mockResolvedValue([] as any);
    findEntitiesByIds.mockReset().mockResolvedValue([] as any);
    findChilds
      .mockReset()
      .mockResolvedValue({ 0: { id: "child-territory" } } as any);
  });

  afterAll(() => {
    findForEntities.mockRestore();
    findEntitiesByIds.mockRestore();
    findChilds.mockRestore();
  });

  it("follows all three downward relations by default", async () => {
    await getSubordinateEntityIds(conn, ["x"]);

    const typesAsked = findForEntities.mock.calls.map((call) => call[2]);
    expect(typesAsked).toEqual(
      expect.arrayContaining([
        RelationEnums.Type.SuperordinateEntity,
        RelationEnums.Type.Superclass,
        RelationEnums.Type.Holonym,
      ])
    );
  });

  it("follows only the relation a caller asks for", async () => {
    findForEntities
      .mockResolvedValueOnce([{ entityIds: ["sub", "x"] }] as any)
      .mockResolvedValue([] as any);

    const ids = await getSubordinateEntityIds(conn, ["x"], {
      relationTypes: [RelationEnums.Type.Superclass],
      includeChildTerritories: false,
    });

    const typesAsked = new Set(findForEntities.mock.calls.map((c) => c[2]));
    expect([...typesAsked]).toEqual([RelationEnums.Type.Superclass]);
    expect(ids).toEqual(["sub"]);
  });

  it("reads no entity rows when the territory closure is not wanted", async () => {
    await getSubordinateEntityIds(conn, ["x"], {
      relationTypes: [RelationEnums.Type.Superclass],
      includeChildTerritories: false,
    });

    expect(findEntitiesByIds).not.toHaveBeenCalled();
    expect(findChilds).not.toHaveBeenCalled();
  });

  it("adds the child territories of a Territory input when asked", async () => {
    findEntitiesByIds.mockResolvedValue([
      { id: "T1", class: EntityEnums.Class.Territory },
    ] as any);

    const ids = await getSubordinateEntityIds(conn, ["T1"], {
      relationTypes: [RelationEnums.Type.SuperordinateEntity],
      includeChildTerritories: true,
    });

    expect(findChilds).toHaveBeenCalledTimes(1);
    expect(ids).toEqual(["child-territory"]);
  });

  it("returns nothing for an empty input without querying", async () => {
    expect(await getSubordinateEntityIds(conn, [])).toEqual([]);
    expect(findForEntities).not.toHaveBeenCalled();
  });
});
