import Acl from "@middlewares/acl";
import { Db } from "@service/RethinkDB";
import { IUser } from "@shared/types";
import "ts-jest";
import { fillArray, fillFlatObject } from "./common";
import User from "./user/user";

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
      const arr: { testKey: string }[] = [];
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
