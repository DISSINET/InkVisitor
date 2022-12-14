import { EntityEnums } from "@shared/enums";
import "ts-jest";
import { determineOrder, fillArray, fillFlatObject } from "./common";

class CustomClass {
  somevar = "initial";

  constructor(data: Record<string, unknown>) {
    this.somevar = (data.somevar as string) || "";
  }
}

describe("test fillArray", function () {
  describe("empty data", () => {
    it("should return empty array", () => {
      const arr: string[] = [];
      fillArray(arr, String, null);
      expect(JSON.stringify(arr)).toEqual(JSON.stringify([]));
    });
  });
  describe("string array", () => {
    it("should return expected array", () => {
      const arr: string[] = [];
      fillArray(arr, String, ["first", "second"]);
      expect(JSON.stringify(arr)).toEqual(JSON.stringify(["first", "second"]));
    });
  });
  describe("generic object constructor", () => {
    it("should return expected array", () => {
      const arr: { testKey: string; }[] = [];
      fillArray(arr, Object, [{ testKey: "first" }, { testKey: "second" }]);
      expect(JSON.stringify(arr)).toEqual(
        JSON.stringify([{ testKey: "first" }, { testKey: "second" }])
      );
    });
  });
  describe("custom classes", () => {
    it("should return expected array", () => {
      const arr: CustomClass[] = [];
      fillArray(arr, CustomClass, [
        { somevar: "first" },
        { somevar: "second" },
      ]);
      const c1 = new CustomClass({ somevar: "first" });
      const c2 = new CustomClass({ somevar: "second" });
      expect(arr).toEqual([c1, c2]);
    });
  });
});

describe("test fillFlatObject", function () {
  describe("empty data", () => {
    it("should return empty object", () => {
      const obj = new CustomClass({});
      fillFlatObject(obj, null);
      expect(obj).toEqual({ somevar: "" });
    });
  });
  describe("object", () => {
    it("should return expected data", () => {
      const obj = { first: "initial" };
      fillFlatObject(obj, { first: "first" });
      expect(obj).toEqual({ first: "first" });
    });
  });
  describe("custom class", () => {
    it("should return expected data", () => {
      const obj = new CustomClass({});
      fillFlatObject(obj, { somevar: "first" });
      const c1 = new CustomClass({ somevar: "first" });
      expect(obj).toEqual(c1);
    });
  });
});

describe("test Entity.determineOrder", function () {
  describe("when wanting already used order value", () => {
    const takenIndex = -2;
    const siblings: Record<number, unknown> = { [takenIndex]: true };

    it("should choose slightly bigger real number", () => {
      expect(determineOrder(takenIndex, siblings)).toBe(takenIndex + 1);
    });
  });

  describe("when wanting already used order value with already used following indexes (+1, +2, +3...)", () => {
    const takenIndex = -2;
    const siblings: Record<number, unknown> = {};
    for (let i = takenIndex; i < 5; i++) {
      siblings[i] = true;
    }

    it("should choose slightly bigger decimal number than originally wanted index", () => {
      expect(determineOrder(takenIndex, siblings)).toBe(
        takenIndex + 0.5
      );
    });
  });

  describe("when wanting unused value", () => {
    const takenIndex = 1;
    const wantedIndex = 2;
    const siblings: Record<number, unknown> = { [takenIndex]: true };

    it("should allow such value", () => {
      expect(determineOrder(wantedIndex, siblings)).toBe(wantedIndex);
    });
  });

  describe("when wanting last position", () => {
    const wantedIndex = EntityEnums.Order.Last;
    const siblings: Record<number, unknown> = { [-1]: true, 0: true, 1: true };
    const values = Object.keys(siblings)
      .map((v) => parseInt(v))
      .sort();

    it("should get originally first index - 1 value", () => {
      expect(determineOrder(wantedIndex, siblings)).toBe(
        values[values.length - 1] + 1
      );
    });
  });
});