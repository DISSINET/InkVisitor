import "ts-jest";
import { EventType } from "@inkvisitor/shared/types/stats";
import {
  foldEventTypeForStats,
  expandEventTypesForStats,
  foldStatsValuesByEventType,
} from "./event-type-fold";

describe("foldEventTypeForStats", () => {
  it("folds DELETE into EDIT", () => {
    expect(foldEventTypeForStats(EventType.DELETE)).toBe(EventType.EDIT);
  });

  it("folds ANCHOR_DELETE into ANCHOR_EDIT", () => {
    expect(foldEventTypeForStats(EventType.ANCHOR_DELETE)).toBe(
      EventType.ANCHOR_EDIT
    );
  });

  it("leaves every other event type unchanged", () => {
    for (const type of [
      EventType.EDIT,
      EventType.CREATE,
      EventType.TEXT_EDIT,
      EventType.ANCHOR_ADD,
      EventType.ANCHOR_EDIT,
    ]) {
      expect(foldEventTypeForStats(type)).toBe(type);
    }
  });
});

describe("expandEventTypesForStats", () => {
  it("includes DELETE when EDIT is requested", () => {
    expect(expandEventTypesForStats([EventType.EDIT])).toEqual(
      expect.arrayContaining([EventType.EDIT, EventType.DELETE])
    );
  });

  it("includes ANCHOR_DELETE when ANCHOR_EDIT is requested", () => {
    expect(expandEventTypesForStats([EventType.ANCHOR_EDIT])).toEqual(
      expect.arrayContaining([EventType.ANCHOR_EDIT, EventType.ANCHOR_DELETE])
    );
  });

  it("does not add delete types when the matching edit type is not requested", () => {
    const out = expandEventTypesForStats([EventType.CREATE, EventType.ANCHOR_ADD]);
    expect(out).not.toContain(EventType.DELETE);
    expect(out).not.toContain(EventType.ANCHOR_DELETE);
  });

  it("does not duplicate types already present", () => {
    const out = expandEventTypesForStats([EventType.EDIT, EventType.DELETE]);
    expect(out.filter((t) => t === EventType.DELETE)).toHaveLength(1);
  });
});

describe("foldStatsValuesByEventType", () => {
  it("merges delete counts into their edit type, summing per time bucket", () => {
    const input = {
      "2026-05-01": {
        [EventType.EDIT]: 2,
        [EventType.DELETE]: 3,
        [EventType.ANCHOR_EDIT]: 1,
        [EventType.ANCHOR_DELETE]: 4,
        [EventType.CREATE]: 5,
      },
    };

    expect(foldStatsValuesByEventType(input)).toEqual({
      "2026-05-01": {
        [EventType.EDIT]: 5,
        [EventType.ANCHOR_EDIT]: 5,
        [EventType.CREATE]: 5,
      },
    });
  });

  it("promotes a delete-only bucket to the edit type", () => {
    const input = { day: { [EventType.DELETE]: 2 } };
    expect(foldStatsValuesByEventType(input)).toEqual({
      day: { [EventType.EDIT]: 2 },
    });
  });

  it("leaves non-event-type keys (e.g. user ids) untouched", () => {
    const input = { day: { "U-123": 7, "U-456": 1 } };
    expect(foldStatsValuesByEventType(input)).toEqual({
      day: { "U-123": 7, "U-456": 1 },
    });
  });
});
