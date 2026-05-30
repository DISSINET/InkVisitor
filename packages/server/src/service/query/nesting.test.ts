import "ts-jest";

// Mock rethinkdb-ts so the evaluator can build its narrowing streams without a
// database. The only ReQL the evaluator itself runs is
// `r.table(...).getAll(r.args(ids))`, which we turn into a plain stream object
// carrying its id set; `getField("id").distinct().run()` resolves to that set.
// Every other r.* access is a harmless chainable no-op (model modules load r at
// import time but never execute it here).
jest.mock("rethinkdb-ts", () => {
  const makeStream = (ids: string[]) => ({
    _ids: ids,
    getField: () => ({ distinct: () => ({ run: async () => ids }) }),
  });
  const magic: any = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "getAll")
        return (...a: any[]) =>
          makeStream(a.length === 1 && Array.isArray(a[0]) ? a[0] : a);
      if (prop === "args") return (a: any) => a;
      if (prop === "table") return () => magic;
      if (prop === "then") return undefined;
      return () => magic;
    },
    apply() {
      return magic;
    },
  });
  return { r: magic };
});

import SearchNode from "./nodes";
import { Query } from "@inkvisitor/shared/types/query";

const { And, Or } = Query.NodeOperator;
const { Positive, Negative } = Query.EdgeLogic;

// a stream standing in for the node base; getField is a spy so tests can assert
// whether the full base id list was materialised
const stream = (ids: string[]) => {
  const getField = jest.fn(() => ({
    distinct: () => ({ run: async () => ids }),
  }));
  return { _ids: ids, getField };
};

// a fake edge whose run() behaves like a per-entity predicate: it returns the
// intersection of its match universe with whatever id set the input stream
// carries - exactly the "subset invariant" the real edges obey
const makeEdge = (
  universe: string[],
  logic: Query.EdgeLogic = Positive,
  childEdges: any[] = [],
  childOperator: Query.NodeOperator = And
) => {
  const set = new Set(universe);
  const run = jest.fn((q: any) => {
    const inputIds: string[] = q?._ids ?? [];
    const matched = inputIds.filter((id) => set.has(id));
    return { distinct: () => ({ run: async () => matched }) };
  });
  const node = new SearchNode({ operator: childOperator });
  (node as any).edges = childEdges;
  return { type: "EP:T", logic, params: {}, id: "e", node, run } as any;
};

const evaluate = (
  baseStream: any,
  edges: any[],
  operator: Query.NodeOperator
): Promise<string[]> => {
  const node = new SearchNode({ operator });
  return (node as any).evaluateEdges({} as any, baseStream, edges, operator);
};

const sorted = (a: string[]) => [...a].sort();

const BASE = ["1", "2", "3", "4", "5", "6"];

describe("evaluateEdges - AND/OR merge, negation, pipeline, recursion", () => {
  it("AND intersects positive edges and narrows each edge over the survivors", async () => {
    const a = makeEdge(["1", "2", "3", "4"], Positive);
    const b = makeEdge(["3", "4", "5", "6"], Positive);

    const result = await evaluate(stream(BASE), [a, b], And);

    expect(sorted(result)).toEqual(["3", "4"]);
    // pipeline: the second edge only saw the survivors of the first, not BASE
    expect(b.run.mock.calls[0][0]._ids).toEqual(["1", "2", "3", "4"]);
  });

  it("AND subtracts a negative edge from the running accumulator", async () => {
    const a = makeEdge(["1", "2", "3", "4"], Positive);
    const b = makeEdge(["3", "4", "5"], Negative);

    const result = await evaluate(stream(BASE), [a, b], And);

    expect(sorted(result)).toEqual(["1", "2"]);
  });

  it("AND with a negative-first edge materialises the base lazily", async () => {
    const base = stream(BASE);
    const a = makeEdge(["2", "3"], Negative);

    const result = await evaluate(base, [a], And);

    expect(sorted(result)).toEqual(["1", "4", "5", "6"]);
    // no positive seed -> the full base had to be fetched
    expect(base.getField).toHaveBeenCalled();
  });

  it("AND of positive edges never fetches the full base", async () => {
    const base = stream(BASE);
    const a = makeEdge(["1", "2", "3"], Positive);
    const b = makeEdge(["2", "3", "4"], Positive);

    await evaluate(base, [a, b], And);

    expect(base.getField).not.toHaveBeenCalled();
  });

  it("AND short-circuits once the accumulator is empty", async () => {
    const a = makeEdge(["1", "2"], Positive);
    const b = makeEdge(["3", "4"], Positive); // disjoint -> empties acc
    const c = makeEdge(["1", "2", "3", "4"], Positive);

    const result = await evaluate(stream(BASE), [a, b, c], And);

    expect(result).toEqual([]);
    expect(c.run).not.toHaveBeenCalled();
  });

  it("OR unions positive matches with a negative complement over the base", async () => {
    const a = makeEdge(["1", "2"], Positive);
    const b = makeEdge(["1", "2", "3"], Negative); // complement = 4,5,6

    const result = await evaluate(stream(BASE), [a, b], Or);

    expect(sorted(result)).toEqual(["1", "2", "4", "5", "6"]);
  });

  it("resolves nested edges recursively, scoped to the parent's matches", async () => {
    // parent: EP(universe 1..4) with a nested NOT(universe {2})
    const nestedNeg = makeEdge(["2"], Negative);
    const parent = makeEdge(["1", "2", "3", "4"], Positive, [nestedNeg], And);

    const result = await evaluate(stream(BASE), [parent], And);

    // 1..4 (parent match) minus 2 (nested negation) = 1,3,4
    expect(sorted(result)).toEqual(["1", "3", "4"]);
    // the nested edge only ran over the parent's matched ids
    expect(nestedNeg.run.mock.calls[0][0]._ids).toEqual(["1", "2", "3", "4"]);
  });
});
