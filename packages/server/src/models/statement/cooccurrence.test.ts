import "ts-jest";
import { IProp, IStatement } from "@inkvisitor/shared/types";
import Statement from "./statement";

// prop carrying a type and a value entity, with optional nested children
const prop = (typeId: string, valueId: string, children: IProp[] = []): IProp =>
  ({
    type: { entityId: typeId },
    value: { entityId: valueId },
    children,
  }) as unknown as IProp;

// only the fields the co-occurrence collection reads; the full statement shape
// carries a dozen more required attributes per action / actant row
const statement = (id: string, data: Record<string, unknown>): IStatement =>
  ({
    id,
    data: {
      actions: [],
      actants: [],
      tags: [],
      ...data,
    },
  }) as unknown as IStatement;

describe("Statement.getCoOccurrentEntityIds", () => {
  const mockStatements = (statements: IStatement[]) =>
    jest
      .spyOn(Statement, "getLinkedEntitiesAnyPosition")
      .mockResolvedValue(statements);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the statement id and every entity in an indexed position", async () => {
    mockStatements([
      statement("s1", {
        territory: { territoryId: "t1", order: 1 },
        actions: [{ actionId: "act1", props: [] }],
        actants: [{ entityId: "a1", props: [] }, { entityId: "input" }],
        tags: ["tag1"],
      }),
    ]);

    const ids = await Statement.getCoOccurrentEntityIds(undefined, "input");

    expect(new Set(ids)).toEqual(new Set(["s1", "t1", "act1", "a1", "tag1"]));
  });

  it("includes in-statement prop type/value ids, children included", async () => {
    mockStatements([
      statement("s1", {
        actions: [{ actionId: "act1", props: [prop("pt1", "pv1")] }],
        actants: [
          {
            entityId: "input",
            props: [prop("pt2", "pv2", [prop("pt3", "pv3")])],
          },
        ],
      }),
    ]);

    const ids = await Statement.getCoOccurrentEntityIds(undefined, "input");

    expect(new Set(ids)).toEqual(
      new Set(["s1", "act1", "pt1", "pv1", "pt2", "pv2", "pt3", "pv3"])
    );
  });

  it("unions the statements of several inputs and returns none of the inputs", async () => {
    // inA and inB co-occur with each other in s1, so each is in the other's
    // co-occurrent set - neither may show up as a result
    mockStatements([
      statement("s1", {
        actants: [{ entityId: "inA" }, { entityId: "inB" }, { entityId: "x" }],
      }),
      statement("s2", {
        actants: [{ entityId: "inB" }, { entityId: "y" }],
      }),
    ]);

    const ids = await Statement.getCoOccurrentEntityIds(undefined, [
      "inA",
      "inB",
    ]);

    expect(new Set(ids)).toEqual(new Set(["s1", "s2", "x", "y"]));
  });

  it("skips the query for an empty input list", async () => {
    const spy = mockStatements([]);

    expect(await Statement.getCoOccurrentEntityIds(undefined, [])).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});
