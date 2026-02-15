import "ts-jest";
import { AnchorsNode, getEntityIdsFromContent } from "./anchors";

const BASE_CONTENT = `<test>
blahdddddsdsd
<ahoj>dsdas</ahoj><sevas>dsaxdddadd</sevas>
</test>`;

describe("AnchorsNode.compareAnchors", () => {
  function compare(oldContent: string, newContent: string) {
    return AnchorsNode.compareAnchors(
      oldContent,
      getEntityIdsFromContent(oldContent),
      newContent,
      getEntityIdsFromContent(newContent)
    );
  }

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
