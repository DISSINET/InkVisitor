import "ts-jest";
import Results from "./results";
import { storage } from "@service/storage";
import User from "@models/user/user";
import { Explore } from "@inkvisitor/shared/types/query";
import { IEntity } from "@inkvisitor/shared/types";

describe("Results.orderByIds", () => {
  const make = (items: string[] | null): Results<{ id: string }> => {
    const r = new Results<{ id: string }>();
    r.items = items;
    return r;
  };

  it("reorders items to match the input id order", () => {
    const r = make(["b", "a", "c"]);
    r.orderByIds(["c", "a", "b"]);
    expect(r.items).toEqual(["c", "a", "b"]);
  });

  it("drops input ids that are absent from items", () => {
    const r = make(["a", "b"]);
    r.orderByIds(["b", "x", "a"]);
    expect(r.items).toEqual(["b", "a"]);
  });

  it("matches case-insensitively, preserving item casing", () => {
    const r = make(["A1B2", "c3d4"]);
    r.orderByIds(["c3d4", "a1b2"]);
    expect(r.items).toEqual(["c3d4", "A1B2"]);
  });

  it("deduplicates repeated input ids", () => {
    const r = make(["a", "b"]);
    r.orderByIds(["b", "b", "a"]);
    expect(r.items).toEqual(["b", "a"]);
  });

  it("appends items missing from the input id list last, in original order", () => {
    const r = make(["a", "b", "c"]);
    r.orderByIds(["c"]);
    expect(r.items).toEqual(["c", "a", "b"]);
  });

  it("is a no-op for empty or null items", () => {
    const empty = make([]);
    empty.orderByIds(["a"]);
    expect(empty.items).toEqual([]);

    const nul = make(null);
    nul.orderByIds(["a"]);
    expect(nul.items).toBeNull();
  });
});

describe("Results column data", () => {
  const conn = {} as any;
  const C = Explore.EExploreColumnType;
  const entity = (id: string, extra: object = {}): IEntity =>
    ({ id, class: "C", labels: [id], props: [], references: [], data: {}, ...extra }) as unknown as IEntity;
  const prop = (type: string, value: string) => ({ type: { entityId: type }, value: { entityId: value }, children: [] });
  const column = (id: string, type: Explore.EExploreColumnType, params: object = {}) =>
    ({ id, name: id, type, editable: false, params }) as unknown as Explore.IExploreColumn;

  // x, y, r, pt, pv, t0 exist; "gone" does not
  const known: Record<string, IEntity> = {};
  for (const id of ["x", "y", "r", "pt", "pv", "t0"]) {
    known[id] = entity(id);
  }
  const rows = [
    entity("a", {
      props: [prop("pt", "pv"), prop("pt", "gone")],
      references: [{ resource: "r", value: "pv" }, { resource: "r", value: "" }, { resource: "", value: "x" }],
    }),
    entity("b"),
    entity("t1", { class: "T", data: { parent: { territoryId: "t0", order: 0 } } }),
  ];
  const columns = [
    column("scl", C.ER, { relationType: "SCL" }),
    column("scl-inverse", C.ER, { relationType: "SCL", inverse: true }),
    column("value", C.EPV, { propertyType: "pt" }),
    column("types", C.EPT),
    column("resources", C.ERR),
    column("ref-values", C.ERV, { resource: "r" }),
    column("creator", C.EUC),
    column("parent", C.EPRT),
  ];

  afterEach(() => jest.restoreAllMocks());

  it("reads the data of every column once per page", async () => {
    const getMany = jest
      .spyOn(storage.entities, "getMany")
      .mockImplementation(async (_conn, ids: string[]) => ids.filter((id) => known[id]).map((id) => known[id]));
    const getOne = jest.spyOn(storage.entities, "get");
    const forEntities = jest.spyOn(storage.relations, "forEntities").mockResolvedValue([
      { id: "r1", type: "SCL", entityIds: ["a", "x"] },
      { id: "r2", type: "SCL", entityIds: ["y", "a"] },
      { id: "r3", type: "SCL", entityIds: ["b", "x"] },
    ] as any);
    const firstForMany = jest.spyOn(storage.audits, "firstForMany").mockResolvedValue([
      { id: "au-a", modelId: "a", user: "u1" },
      { id: "au-b", modelId: "b", user: "deleted" },
    ] as any);
    const firstFor = jest.spyOn(storage.audits, "firstFor");
    jest.spyOn(User, "findUserById").mockImplementation(async (_db, id) => (id === "u1" ? ({ id: "u1" } as any) : null));

    const results = new Results<IEntity>();
    const context = await results.prepareColumnsContext(conn, rows, columns);
    const [a, b, t1] = rows.map((row) => results.columns(row, columns, context));

    expect(getMany).toHaveBeenCalledTimes(1);
    expect(getOne).not.toHaveBeenCalled();
    expect(forEntities).toHaveBeenCalledTimes(2); // one per ER column
    expect(firstForMany).toHaveBeenCalledTimes(1);
    expect(firstFor).not.toHaveBeenCalled();

    expect(a["scl"]).toEqual([known.x]); // the row is the subject of r1 only
    expect(a["scl-inverse"]).toEqual([known.y]);
    expect(b["scl"]).toEqual([known.x]);
    expect(a["value"]).toEqual([known.pv]); // "gone" has no entity
    expect(a["types"]).toEqual([known.pt]);
    expect(a["resources"]).toEqual([known.r, known.r]); // a repeated resource stays repeated, "" is dropped
    expect(a["ref-values"]).toEqual([known.pv]);
    expect(a["creator"]).toEqual({ id: "u1" });
    expect(b["creator"]).toBeUndefined(); // creator deleted
    expect(t1["creator"]).toBeUndefined(); // no audit
    expect(t1["parent"]).toEqual(known.t0);
    expect(a["parent"]).toBeUndefined();
    expect(b["value"]).toEqual([]);
  });

  it("issues no query for a view without columns", async () => {
    const getMany = jest.spyOn(storage.entities, "getMany");
    const results = new Results<IEntity>();
    const context = await results.prepareColumnsContext(conn, rows, []);
    expect(results.columns(rows[0], [], context)).toEqual({});
    expect(getMany).not.toHaveBeenCalled();
  });
});
