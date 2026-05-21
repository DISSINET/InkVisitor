import "ts-jest";
import Audit from "./audit";
import { EventType } from "@shared/types/stats";

describe("Audit.resolveDocumentAuditType", () => {
  test("returns anchor_add when anchors were added", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: true,
        anchorsRemoved: false,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_ADD);
  });

  test("anchor additions outrank removals in the same save", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: true,
        anchorsRemoved: true,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_ADD);
  });

  test("returns anchor_remove when anchors were removed and none added", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: false,
        anchorsRemoved: true,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_REMOVE);
  });

  test("anchor changes outrank text changes", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: false,
        anchorsRemoved: true,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_REMOVE);
  });

  test("returns text_edit when only content changed (no anchor add/remove)", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: false,
        anchorsRemoved: false,
        contentChanged: true,
      })
    ).toBe(EventType.TEXT_EDIT);
  });

  test("returns edit when nothing changed (fallback)", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: false,
        anchorsRemoved: false,
        contentChanged: false,
      })
    ).toBe(EventType.EDIT);
  });
});
