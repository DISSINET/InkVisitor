import { IEntity } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { anchoredMatchingTyped } from "./anchoredNearby";

const entity = (id: string, ...labels: string[]) => ({ id, labels }) as IEntity;

const anchored = [
  entity("p1", "Petrus Maurini", "Peter Maury"),
  entity("l1", "Montaillou"),
  entity("p2", "Guillelmus Maurs"),
];

const ids = (entities: IEntity[]) => entities.map((e) => e.id);

describe("anchoredMatchingTyped", () => {
  it("lists every anchored entity on an empty input", () => {
    expect(ids(anchoredMatchingTyped(anchored, ""))).toEqual(["p1", "l1", "p2"]);
    expect(ids(anchoredMatchingTyped(anchored, "  "))).toEqual(["p1", "l1", "p2"]);
  });

  it("keeps the entities with a label holding the typed text, whatever the case", () => {
    expect(ids(anchoredMatchingTyped(anchored, "maur"))).toEqual(["p1", "p2"]);
  });

  it("matches an alternative label", () => {
    expect(ids(anchoredMatchingTyped(anchored, "Peter"))).toEqual(["p1"]);
  });

  it("lists nothing when no label holds the typed text", () => {
    expect(ids(anchoredMatchingTyped(anchored, "Tolosa"))).toEqual([]);
  });

  it("matches the way label search does: accents, quote marks, spaces and wildcards aside", () => {
    const labelled = [
      entity("b1", "Raimond Bélibaste"),
      entity("o1", "Bernard d’Ornolac"),
      entity("m1", "Petrus de Maurini"),
    ];

    expect(ids(anchoredMatchingTyped(labelled, "beli"))).toEqual(["b1"]);
    expect(ids(anchoredMatchingTyped(labelled, "d'orn"))).toEqual(["o1"]);
    expect(ids(anchoredMatchingTyped(labelled, "petrus  maur"))).toEqual(["m1"]);
    expect(ids(anchoredMatchingTyped(labelled, "*aur"))).toEqual(["m1"]);
  });

  it("matches a statement by its anchored text, the label its row shows", () => {
    const statements = [
      { ...entity("s1", ""), anchorTexts: ["Petrus vidit Paulum"] },
      { ...entity("s2"), anchorTexts: ["et dixit"] },
    ];

    expect(ids(anchoredMatchingTyped(statements, "vidit"))).toEqual(["s1"]);
  });

  it("skips an entity without labels instead of failing", () => {
    const broken = [{ id: "x" } as IEntity, entity("n", null as unknown as string, "Peter")];

    expect(ids(anchoredMatchingTyped(broken, "pet"))).toEqual(["n"]);
  });
});
