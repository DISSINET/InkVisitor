import { RelationEnums } from "@inkvisitor/shared/enums";
import { IResponseDetail, Relation } from "@inkvisitor/shared/types";
import { Edge } from "reactflow";
import { convertToGraph, orderColumns } from "./EntityDetailGraphLayout";

const link = (source: string, target: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
});

const fromRoot = (ids: string[]) => ids.map((id) => link("root", id));

const connection = (
  entityIds: [string, string],
  subtrees: Relation.IConnection<Relation.IRelation>[] = []
): Relation.IConnection<Relation.IRelation> => ({
  id: entityIds.join("-"),
  type: RelationEnums.Type.Identification,
  entityIds,
  subtrees,
});

const graphOf = (relations: Relation.IConnection<Relation.IRelation>[], asymmetrical = false) =>
  convertToGraph({ id: "root" } as IResponseDetail, relations, {}, 200, 90, asymmetrical);

describe("orderColumns", () => {
  test("puts entities of one column that are linked to each other next to each other", () => {
    const column = ["a", "b", "c", "d", "e"];
    // a chain b - d - e - c, spread over the column in the order it came in
    const chain = [link("b", "d"), link("d", "e"), link("e", "c")];

    const rows = orderColumns([["root"], column], [...fromRoot(column), ...chain]);

    for (const { source, target } of chain) {
      expect(Math.abs(rows[source] - rows[target])).toBe(1);
    }
  });

  test("places an entity beside the one it hangs off in the column before", () => {
    const rows = orderColumns(
      [["root"], ["a", "b", "c"], ["x", "y"]],
      [...fromRoot(["a", "b", "c"]), link("c", "x"), link("a", "y")]
    );

    expect(rows.y).toBeLessThan(rows.x);
  });

  test("keeps the order of a column larger than the reordering limit", () => {
    const column = ["a", "b", "c", "d", "e", "f", "g", "h"];

    const rows = orderColumns([["root"], column], [...fromRoot(column), link("a", "h")]);

    expect(column.map((id) => rows[id])).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("convertToGraph", () => {
  test("puts an entity at its shortest distance from the root", () => {
    const { nodes } = graphOf([
      connection(["root", "a"], [connection(["a", "b"])]),
      connection(["root", "b"]),
    ]);

    const levelOf = (id: string) => nodes.find((node) => node.id === id)?.data.level;
    expect(levelOf("a")).toBe(1);
    expect(levelOf("b")).toBe(1);
  });

  test("draws a symmetrical relation once, an asymmetrical one in both directions", () => {
    const relations = [
      connection(["root", "a"], [connection(["a", "b"])]),
      connection(["root", "b"], [connection(["b", "a"])]),
    ];

    expect(graphOf(relations).edges).toHaveLength(3);
    expect(graphOf(relations, true).edges).toHaveLength(4);
  });

  test("links neighbours in a column straight and others with an arc", () => {
    const { edges } = graphOf([
      connection(["root", "a"], [connection(["a", "b"]), connection(["a", "c"])]),
      connection(["root", "b"], [connection(["b", "c"])]),
      connection(["root", "c"]),
    ]);

    // all three are linked to each other, so one pair of them is two rows apart
    const sameColumn = edges.filter((edge) => edge.source !== "root");
    const arcs = sameColumn.filter((edge) => edge.data.arc);
    expect(sameColumn).toHaveLength(3);
    expect(arcs).toHaveLength(1);
    expect(arcs[0]).toMatchObject({ sourceHandle: "source-right", targetHandle: "target-right" });
    for (const edge of sameColumn.filter((edge) => !edge.data.arc)) {
      expect([edge.sourceHandle, edge.targetHandle].sort()).toEqual(
        edge.sourceHandle === "source-bottom"
          ? ["source-bottom", "target-top"]
          : ["source-top", "target-bottom"]
      );
    }
  });
});
