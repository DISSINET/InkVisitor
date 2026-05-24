import "ts-jest";
import Audit from "./audit";
import { EventType } from "@inkvisitor/shared/types/stats";

describe("Audit.resolveDocumentAuditType", () => {
  test("returns anchor_add when anchors were added", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: true,
        anchorsRemoved: false,
        anchorAttributesChanged: false,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_ADD);
  });

  test("anchor additions outrank removals in the same save", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: true,
        anchorsRemoved: true,
        anchorAttributesChanged: false,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_ADD);
  });

  test("returns anchor_delete when anchors were removed and none added", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: false,
        anchorsRemoved: true,
        anchorAttributesChanged: false,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_DELETE);
  });

  test("anchor changes outrank text changes", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: false,
        anchorsRemoved: true,
        anchorAttributesChanged: false,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_DELETE);
  });

  test("returns anchor_edit when an anchor attribute changed", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: false,
        anchorsRemoved: false,
        anchorAttributesChanged: true,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_EDIT);
  });

  test("anchor_edit outranks text_edit", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: false,
        anchorsRemoved: false,
        anchorAttributesChanged: true,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_EDIT);
  });

  test("anchor add/remove outrank an attribute change", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: true,
        anchorsRemoved: false,
        anchorAttributesChanged: true,
        contentChanged: true,
      })
    ).toBe(EventType.ANCHOR_ADD);
  });

  test("returns text_edit when only content changed (no anchor changes)", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: false,
        anchorsRemoved: false,
        anchorAttributesChanged: false,
        contentChanged: true,
      })
    ).toBe(EventType.TEXT_EDIT);
  });

  test("returns edit when nothing changed (fallback)", () => {
    expect(
      Audit.resolveDocumentAuditType({
        anchorsAdded: false,
        anchorsRemoved: false,
        anchorAttributesChanged: false,
        contentChanged: false,
      })
    ).toBe(EventType.EDIT);
  });
});
