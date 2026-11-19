import { EntityEnums } from "@inkvisitor/shared/enums";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";
import { AnchorsNode } from "@models/document/anchors";
import { AnchorSpot, anchoredUnder } from "./anchored";

const C = EntityEnums.Class;
const ENTITY_IDS = {
  [C.Territory]: ["t1", "t2"],
  [C.Person]: ["p1", "p2"],
  [C.Location]: ["l1"],
  [C.Statement]: ["s1"],
  [C.Concept]: ["c1", "c9"],
  [C.Resource]: ["r1"],
} as Record<EntityEnums.Class, string[]>;
/** the anchors of a document with this content, read off the tree a save stores */
const spots = (content: string): AnchorSpot[] => {
  const flatten = (nodes: IAnchorsNode[]): AnchorSpot[] =>
    nodes.reduce<AnchorSpot[]>(
      (all, node) => [...all, [node.anchor, node.class, node.indexStart, node.indexEnd], ...flatten(node.children)],
      []
    );
  return flatten(AnchorsNode.buildAnchorsTree(content, ENTITY_IDS));
};
const sorted = (ids: string[]) => [...ids].sort();

const book = spots("<c9>a</c9> <t1> <p1>b</p1> <t2> <l1>c</l1> <s1> <c1>d</c1> </s1> </t2> </t1>");
const appendix = spots("<t2> <r1>e</r1> </t2>");

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

  it("an anchor stored without its positions lies in no span and spans nothing", () => {
    const legacy: AnchorSpot[] = [
      ["t1", C.Territory, null, null],
      ["p1", C.Person, null, null],
    ];
    expect(anchoredUnder([[], legacy], null)).toEqual([]);
    expect(anchoredUnder([[["t1", C.Territory, 0, 50], ["p1", C.Person, null, null], [null, null, 5, 9]]], null)).toEqual([]);
  });

  it("an anchor crossing the end of the span keeps what follows the span out", () => {
    // s1 opens inside t1 and closes after t2, so the tree nests t2 below t1
    const crossing = spots("<t1> <p1>a</p1> <s1> b </t1> <t2> <p2>c</p2> </t2> </s1>");
    expect(sorted(anchoredUnder([crossing], ["t1"]))).toEqual(["p1", "s1"]);
    expect(sorted(anchoredUnder([crossing], null))).toEqual(["p1", "p2", "s1"]);
  });

  it("a territory opened inside the span and closed after it does not bring its own span along", () => {
    // t2 and t1 open at the same place, the tag of t2 first, so the tree nests t1 below t2
    const wrapped = spots("<t2><t1>a</t2> b <p1>c</p1> </t1>");
    expect(anchoredUnder([wrapped], ["t2"])).toEqual(["t1"]);
    expect(anchoredUnder([wrapped], ["t1"])).toEqual(["p1"]);
  });

  it("a territory tag that never closes spans nothing", () => {
    const unclosed = spots("<t1> <p1>a</p1> <t2> <p2>b</p2> </t2>");
    expect(anchoredUnder([unclosed], ["t1"])).toEqual([]);
    expect(anchoredUnder([unclosed], null)).toEqual(["p2"]);
  });
});
