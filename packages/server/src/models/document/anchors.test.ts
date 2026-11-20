import "ts-jest";
import { createOpeningTagRegex } from "@common/regex";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";
import { AnchorsNode } from "./anchors";

const BASE_CONTENT = `<test>
blahdddddsdsd
<ahoj>dsdas</ahoj><sevas>dsaxdddadd</sevas>
</test>`;

function entityIdsFromContent(content: string): Record<EntityEnums.Class, string[]> {
  const regex = createOpeningTagRegex();
  const tagNames = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    tagNames.add(match[1].split(/\s+/)[0]);
  }
  const result: Record<EntityEnums.Class, string[]> = {
    [EntityEnums.Class.Action]: [],
    [EntityEnums.Class.Resource]: [],
    [EntityEnums.Class.Concept]: Array.from(tagNames),
    [EntityEnums.Class.Person]: [],
    [EntityEnums.Class.Location]: [],
    [EntityEnums.Class.Event]: [],
    [EntityEnums.Class.Object]: [],
    [EntityEnums.Class.Territory]: [],
    [EntityEnums.Class.Statement]: [],
    [EntityEnums.Class.Value]: [],
    [EntityEnums.Class.Being]: [],
    [EntityEnums.Class.Group]: [],
  };
  return result;
}

function compare(oldContent: string, newContent: string) {
  const oldTree = AnchorsNode.buildAnchorsTree(
    oldContent,
    entityIdsFromContent(oldContent)
  );
  const newTree = AnchorsNode.buildAnchorsTree(
    newContent,
    entityIdsFromContent(newContent)
  );
  return AnchorsNode.compareAnchorTrees(oldTree, newTree);
}

describe("AnchorsNode.compareAnchorTrees", () => {
  it("detects removal of sevas anchor", () => {
    const withoutSevas = `<test>
blahdddddsdsd
<ahoj>dsdas</ahoj>
</test>`;
    const diff = compare(BASE_CONTENT, withoutSevas);
    expect(diff.removals).toContainEqual({ anchor: "sevas", occurrence: 0 });
    expect(diff.removals).toHaveLength(1);
    expect(diff.additions).toHaveLength(0);
    expect(diff.changes).toContainEqual({ anchor: "test", occurrence: 0 });
    expect(diff.changes).toHaveLength(1);
  });

  it("detects content change of sevas anchor only", () => {
    const sevasContentChanged = `<test>
blahdddddsdsd
<ahoj>dsdas</ahoj><sevas>new content here</sevas>
</test>`;
    const diff = compare(BASE_CONTENT, sevasContentChanged);
    expect(diff.changes).toContainEqual({ anchor: "sevas", occurrence: 0 });
    expect(diff.changes).toHaveLength(1);
    expect(diff.additions).toHaveLength(0);
    expect(diff.removals).toHaveLength(0);
  });

  it("detects new anchor added inside sevas", () => {
    const withNestedAnchor = `<test>
blahdddddsdsd
<ahoj>dsdas</ahoj><sevas>dsaxdddadd<newanchor>inner</newanchor></sevas>
</test>`;
    const diff = compare(BASE_CONTENT, withNestedAnchor);
    expect(diff.additions).toContainEqual({ anchor: "newanchor", occurrence: 0 });
    expect(diff.additions).toHaveLength(1);
    expect(diff.removals).toHaveLength(0);
    expect(diff.changes).toHaveLength(1);
  });
});

describe("AnchorsNode.buildAnchorsTree with self-closing tags", () => {
  test("a self-closing tag inside an anchor neither becomes a node nor closes the anchor", () => {
    const content = "<e1>text <e2 /> more</e1> after <e3>x</e3>";
    const tree = AnchorsNode.buildAnchorsTree(content, entityIdsFromContent(content));

    expect(tree.map((node) => node.anchor)).toEqual(["e1", "e3"]);
    expect(tree[0].children).toHaveLength(0);
    expect(tree[0].content).toEqual("text  more");
    expect(tree[0].indexEnd).toEqual(content.indexOf("</e1>") + "</e1>".length);
    expect(tree[1].content).toEqual("x");
  });

  test("a self-closing tag of the same entity leaves the surrounding anchor intact", () => {
    const content = "<e1>text <e1 /> more</e1>";
    const tree = AnchorsNode.buildAnchorsTree(content, entityIdsFromContent(content));

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(0);
    expect(tree[0].content).toEqual("text  more");
  });
});

describe("AnchorsNode.buildAnchorsTree with paired tags that are not anchors", () => {
  // only e1 and e2 are entities; <hi> is markup of an imported document
  const entityIds = (ids: string[]) => ({
    ...entityIdsFromContent(""),
    [EntityEnums.Class.Concept]: ids,
  });

  test("a paired tag that is not an anchor leaves the anchor around it open", () => {
    const content = "<e1>text <hi>bold</hi> more <e2>x</e2></e1>";
    const tree = AnchorsNode.buildAnchorsTree(content, entityIds(["e1", "e2"]));

    expect(tree.map((node) => node.anchor)).toEqual(["e1"]);
    expect(tree[0].content).toEqual("text bold more x");
    expect(tree[0].indexEnd).toEqual(content.length);
    expect(tree[0].children.map((node) => node.anchor)).toEqual(["e2"]);
  });

  test("an anchor ends at its own closing tag when another anchor crosses it", () => {
    const content = "<e1>a <e2>b</e1> c</e2> <e3>d</e3>";
    const tree = AnchorsNode.buildAnchorsTree(content, entityIds(["e1", "e2", "e3"]));

    expect(tree.map((node) => node.anchor)).toEqual(["e1", "e3"]);
    expect(tree[0].indexEnd).toEqual(content.indexOf("</e1>") + "</e1>".length);
    expect(tree[0].children.map((node) => node.anchor)).toEqual(["e2"]);
    expect(tree[0].children[0].indexEnd).toEqual(content.indexOf("</e2>") + "</e2>".length);
  });

  test("an anchor crossed by another one keeps the anchors opened after the crossing", () => {
    const content = "<e1>A <e2>B </e1> <e3>C</e3></e2>";
    const tree = AnchorsNode.buildAnchorsTree(content, entityIds(["e1", "e2", "e3"]));

    const crossed = tree[0].children[0];
    expect(crossed.anchor).toEqual("e2");
    expect(crossed.indexEnd).toEqual(content.length);
    expect(crossed.children.map((node) => node.anchor)).toEqual(["e3"]);
  });
});

describe("AnchorsNode.collectAnchoredNearby", () => {
  const entityIds = {
    ...entityIdsFromContent(""),
    [EntityEnums.Class.Territory]: ["t1", "t2"],
    [EntityEnums.Class.Statement]: ["s1", "s2"],
    [EntityEnums.Class.Person]: ["p1", "p2", "p3", "p4", "p5", "p9"],
    [EntityEnums.Class.Location]: ["l1", "l2"],
  };
  const tree = (content: string) => AnchorsNode.buildAnchorsTree(content, entityIds);
  const nearby = (trees: IAnchorsNode[][], entityId = "s1") =>
    AnchorsNode.collectAnchoredNearby(trees, entityId).map((node) => node.id);

  test("lists the statement's span first, then each territory anchor around it, nearest anchors first", () => {
    // s1 sits in the subT t2, which sits in t1
    const document = tree(
      "<t1><p1>Anna</p1> came. " +
        "<t2><l1>Rome</l1> <s1><p2>Peter</p2> saw <p3>Paul</p3></s1> in <l2>Milan</l2> " +
        "<s2>and <p4>Eve</p4></s2></t2> <p5>Tom</p5></t1>"
    );

    expect(nearby([document])).toEqual(["p2", "p3", "l1", "l2", "s2", "p4", "p1", "p5"]);
    expect(AnchorsNode.collectAnchoredNearby([document], "s1")[2]).toEqual({
      id: "l1",
      class: EntityEnums.Class.Location,
    });
  });

  test("lists the statements anchored nearby, never a territory or the statement itself", () => {
    // s2 is anchored in the span of s1, which is anchored twice in the subT t2
    const document = tree(
      "<t1><t2><s1>a <s2>b</s2></s1> <p1>Anna</p1> <s1>c</s1></t2> <t2>d</t2></t1>"
    );

    expect(nearby([document])).toEqual(["s2", "p1"]);
    expect(nearby([document], "s2")).toEqual(["s1", "p1"]);
  });

  test("lists an entity anchored several times once, at its closest anchor", () => {
    const repeated = tree("<t1><p1>Anna</p1> <s1><p2>Peter</p2></s1> <p2>he</p2> <p1>she</p1></t1>");

    expect(nearby([repeated])).toEqual(["p2", "p1"]);
  });

  test("covers every span of a statement anchored several times, across documents", () => {
    const first = tree("<t1><s1><p1>Anna</p1></s1> <p3>Paul</p3></t1>");
    const second = tree("<s1><p2>Peter</p2></s1> and <s1><l1>Rome</l1></s1>");

    expect(nearby([first, second])).toEqual(["p1", "p2", "l1", "p3"]);
  });

  test("counts the distance from the nearest of the statement's spans", () => {
    const twice = tree(
      "<t1><s1>a</s1> <p1>1</p1> <p2>2</p2> <p3>3</p3> <p9>9</p9> <s1>b</s1></t1>"
    );

    expect(nearby([twice])).toEqual(["p1", "p9", "p2", "p3"]);
  });

  test("walks every anchor of the subT, not only the one around the statement", () => {
    expect(nearby([tree("<t1><s1>a</s1></t1> mid <t1><p3>C</p3></t1>")])).toEqual(["p3"]);
    expect(
      nearby([tree("<t1><t2><s1>a</s1></t2> <p1>x</p1> <t2><p2>y</p2></t2></t1>")])
    ).toEqual(["p2", "p1"]);
  });

  test("keeps the entities anchored after an anchor crossing the statement's span", () => {
    expect(nearby([tree("<t1><p1>A</p1> <s1><p2>B</p2> </t1> <p3>C</p3></s1>")])).toEqual([
      "p2",
      "p3",
      "p1",
    ]);
  });

  test("lists nothing for a statement that is not anchored", () => {
    expect(nearby([tree("<t1><p1>Anna</p1></t1>")], "s3")).toEqual([]);
  });
});
