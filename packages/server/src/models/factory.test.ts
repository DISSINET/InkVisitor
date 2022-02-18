import { EntityClass } from "@shared/enums";
import "ts-jest";
import { getEntityClass } from "./factory";
import "ts-jest";

describe("Factory test", function () {
  describe("known types", () => {
    it("should return implementation", () => {
      for (const aType of Object.values(EntityClass)) {
        expect(getEntityClass({ class: aType })).not.toBeNull();
      }
    });
  });
  describe("unknown types", () => {
    it("should return null", () => {
      expect(getEntityClass({ class: "random" })).toBeNull();
    });
  });
  describe("empty type", () => {
    it("should return null", () => {
      expect(getEntityClass({})).toBeNull();
    });
  });
  describe("undefined input", () => {
    it("should return null", () => {
      expect(getEntityClass(undefined)).toBeNull();
    });
  });
});
