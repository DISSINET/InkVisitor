import { ActionEntity, ActionValency } from "@models/action/action";
import { EntityEnums } from "@shared/enums";
import "ts-jest";

describe("models/action/ActionEntity", function () {
  describe("test ActionEntity.isValid", function () {
    test("no value set - still valid", () => {
      const inst = new ActionEntity({});
      expect(inst.isValid()).toBeTruthy();
    });
    test("only a1 a2 with valid value", () => {
      const inst = new ActionEntity({
        a1: [EntityEnums.Class.Object],
        a2: [EntityEnums.Extension.Empty],
      });
      expect(inst.isValid()).toBeTruthy();
    });
    test("a1, a2 valid, but s invalid (random string)", () => {
      const inst = new ActionEntity({
        a1: [EntityEnums.Class.Object],
        a2: [EntityEnums.Extension.Empty],
        s: ["random" as EntityEnums.Class], // fake it
      });
      expect(inst.isValid()).toBeFalsy();
    });
    test("a1 with invalid value(null literal)", () => {
      const inst = new ActionEntity({
        a1: ["NULL" as EntityEnums.Class],
      });
      expect(inst.isValid()).toBeFalsy();
    });
  });
});

describe("models/action/ActionValency", function () {
  describe("test ActionValency.isValid", function () {
    test("no value set - still valid", () => {
      const inst = new ActionValency({});
      expect(inst.isValid()).toBeTruthy();
    });
    test("only a1 a2 with valid value", () => {
      const inst = new ActionValency({
        a1: EntityEnums.Class.Object,
        a2: EntityEnums.Extension.Empty,
      });
      expect(inst.isValid()).toBeTruthy();
    });
    test("a1 with invalid value(null literal)", () => {
      const inst = new ActionEntity({
        a1: ["NULL" as EntityEnums.Class],
      });
      expect(inst.isValid()).toBeFalsy();
    });
  });
});
