import { EntityEnums } from "@inkvisitor/shared/enums";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";
import { anchoredUnder } from "./anchored";

const C = EntityEnums.Class;
const node = (anchor: string, cls: EntityEnums.Class, children: IAnchorsNode[] = []): IAnchorsNode => ({
  anchor,
  class: cls,
  children,
  content: "",
  indexStart: 0,
  indexEnd: 0,
});
const sorted = (ids: string[]) => [...ids].sort();

// <c9/> <t1> <p1/> <t2> <l1/> <s1><c1/></s1> </t2> </t1>
const book: IAnchorsNode[] = [
  node("c9", C.Concept),
  node("t1", C.Territory, [
    node("p1", C.Person),
    node("t2", C.Territory, [node("l1", C.Location), node("s1", C.Statement, [node("c1", C.Concept)])]),
  ]),
];
// <t2> <r1/> </t2>
const appendix: IAnchorsNode[] = [node("t2", C.Territory, [node("r1", C.Resource)])];

describe("anchoredUnder", () => {
  it("lists every anchor inside the span of the territory, at any depth", () => {
    expect(sorted(anchoredUnder([book], ["t1"]))).toEqual(["c1", "l1", "p1", "s1", "t2"]);
  });

  it("leaves out the territory itself and the anchors outside its span", () => {
    expect(sorted(anchoredUnder([book], ["t2"]))).toEqual(["c1", "l1", "s1"]);
  });

  it("reads the spans of a territory anchored in several documents", () => {
    expect(sorted(anchoredUnder([book, appendix], ["t2"]))).toEqual(["c1", "l1", "r1", "s1"]);
  });

  it("without territory ids reads the span of every territory", () => {
    expect(sorted(anchoredUnder([book, appendix], null))).toEqual(["c1", "l1", "p1", "r1", "s1", "t2"]);
  });

  it("an anchor of another class spans nothing, even when listed", () => {
    expect(anchoredUnder([book], ["s1"])).toEqual([]);
  });

  it("a document without a tree, or a node without children, holds no anchors", () => {
    const leaf = { anchor: "t1", class: C.Territory } as IAnchorsNode;
    expect(anchoredUnder([undefined, [], [leaf]], null)).toEqual([]);
  });
});
