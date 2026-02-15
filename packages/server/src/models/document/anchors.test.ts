import "ts-jest";
import { createOpeningTagRegex } from "@common/regex";
import { EntityEnums } from "@shared/enums";
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
