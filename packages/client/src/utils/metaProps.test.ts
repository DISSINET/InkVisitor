import { IProp } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { addChildMetaProp, moveMetaProp, removeMetaProp, updateMetaProp } from "./metaProps";

const prop = (id: string, children: IProp[] = []) => ({ id, children }) as IProp;

const tree = () => [prop("a", [prop("a1", [prop("a11"), prop("a12")]), prop("a2")]), prop("b")];

const ids = (props: IProp[]): unknown[] =>
  props.map((p) => (p.children.length ? [p.id, ids(p.children)] : p.id));

describe("metaProps", () => {
  it("adds a child under a first-level and a second-level prop", () => {
    expect(ids(addChildMetaProp(tree(), "b", prop("new")))).toEqual([
      ["a", [["a1", ["a11", "a12"]], "a2"]],
      ["b", ["new"]],
    ]);
    expect(ids(addChildMetaProp(tree(), "a2", prop("new")))).toEqual([
      ["a", [["a1", ["a11", "a12"]], ["a2", ["new"]]]],
      "b",
    ]);
  });

  it("updates a prop on any level", () => {
    const changes = { bundleOperator: "x" } as unknown as Partial<IProp>;
    const updated = updateMetaProp(tree(), "a12", changes);
    expect(updated[0].children[0].children[1]).toMatchObject(changes);
    expect(updated[0].children[0].children[0]).not.toMatchObject(changes);
  });

  it("removes a prop on any level", () => {
    expect(ids(removeMetaProp(tree(), "b"))).toEqual([["a", [["a1", ["a11", "a12"]], "a2"]]]);
    expect(ids(removeMetaProp(tree(), "a11"))).toEqual([["a", [["a1", ["a12"]], "a2"]], "b"]);
  });

  it("moves a prop among its siblings on any level", () => {
    expect(ids(moveMetaProp(tree(), "b", 1, 0))).toEqual([
      "b",
      ["a", [["a1", ["a11", "a12"]], "a2"]],
    ]);
    expect(ids(moveMetaProp(tree(), "a12", 1, 0))).toEqual([
      ["a", [["a1", ["a12", "a11"]], "a2"]],
      "b",
    ]);
  });

  it("leaves the given props untouched", () => {
    const original = tree();
    const snapshot = JSON.stringify(original);
    addChildMetaProp(original, "a1", prop("new"));
    updateMetaProp(original, "a11", { id: "changed" });
    removeMetaProp(original, "a11");
    moveMetaProp(original, "a12", 1, 0);
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});
