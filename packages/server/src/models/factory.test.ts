import { ActantType } from "@shared/enums";
import "ts-jest";
import Statement, { StatementTerritory } from "./statement";
import { getActantType } from "./factory";
import "ts-jest";

describe("Factory test", function () {
  describe("known types", () => {
    it("should return implementation", () => {
      for (const aType of Object.values(ActantType)) {
        expect(getActantType({ class: aType })).not.toBeNull();
      }
    });
  });
  describe("unknown types", () => {
    it("should return null", () => {
      expect(getActantType({ class: "random" })).toBeNull();
    });
  });
  describe("empty type", () => {
    it("should return null", () => {
      expect(getActantType({})).toBeNull();
    });
  });
  describe("undefined input", () => {
    it("should return null", () => {
      expect(getActantType(undefined)).toBeNull();
    });
  });
});
