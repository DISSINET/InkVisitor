import "ts-jest";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { EventType } from "@inkvisitor/shared/types/stats";
import { AnchorsNode } from "./anchors";

function emptyEntityIds(): Record<EntityEnums.Class, string[]> {
  return {
    [EntityEnums.Class.Action]: [],
    [EntityEnums.Class.Resource]: [],
    [EntityEnums.Class.Concept]: [],
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
}

function entityIdsWithTerritory(
  territoryId: string
): Record<EntityEnums.Class, string[]> {
  return {
    ...emptyEntityIds(),
    [EntityEnums.Class.Territory]: [territoryId],
  };
}

describe("AnchorsNode.finalizeDocumentAuditChanges", () => {
  test("anchor_add puts new statement tag in additions and drops parent territory from changes", () => {
    const territoryId = "territory-1";
    const statementId = "statement-new";
    const oldContent = `<${territoryId}>selected text</${territoryId}>`;
    const newContent = `<${territoryId}><${statementId}>selected text</${statementId}></${territoryId}>`;

    const entityIds = entityIdsWithTerritory(territoryId);
    const oldTree = AnchorsNode.buildAnchorsTree(oldContent, entityIds);
    const newTree = AnchorsNode.buildAnchorsTree(newContent, entityIds);
    const newOrderedList = AnchorsNode.getOrderedAnchorListFromTree(newTree);
    const treeDiff = AnchorsNode.diffOrderedAnchorLists(
      AnchorsNode.getOrderedAnchorListFromTree(oldTree),
      newOrderedList
    );

    const audit = AnchorsNode.finalizeDocumentAuditChanges({
      auditType: EventType.ANCHOR_ADD,
      oldContent,
      newContent,
      treeDiff,
      newOrderedList,
    });

    expect(audit.additions).toContainEqual({
      anchor: statementId,
      occurrence: 0,
    });
    expect(audit.changes).not.toContainEqual({
      anchor: territoryId,
      occurrence: 0,
    });
    expect(audit.changes).toHaveLength(0);
  });

  test("getAnchorTagAdditions lists each new tag occurrence", () => {
    expect(
      AnchorsNode.getAnchorTagAdditions(
        "<C1>foo</C1>",
        "<C1>foo</C1> <C1>bar</C1>"
      )
    ).toEqual([{ anchor: "C1", occurrence: 1 }]);
  });
});
