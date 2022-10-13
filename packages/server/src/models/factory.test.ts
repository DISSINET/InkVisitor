import { EntityEnums, RelationEnums } from "@shared/enums";
import "ts-jest";
import { getEntityClass, getRelationClass } from "./factory";
import "ts-jest";

describe("Entity factory test", function () {
  describe("known types", () => {
    it("should return implementation", () => {
      for (const aType of Object.values(EntityEnums.Class)) {
        expect(getEntityClass({ class: aType })).not.toBeNull();
      }
    });
  });
  describe("unknown types", () => {
    it("should return null", () => {
      expect(() => getEntityClass({ class: "random" })).toThrowError();
    });
  });
  describe("empty type", () => {
    it("should return null", () => {
      expect(() => getEntityClass({})).toThrowError();
    });
  });
  describe("undefined input", () => {
    it("should return null", () => {
      expect(() => getEntityClass(undefined)).toThrowError();
    });
  });
});

describe("Relationship factory test", function () {
  describe("known types", () => {
    it("should return implementation", () => {
      for (const rType of Object.values(RelationEnums.Type).filter(type => !!type)) {
        const instance = getRelationClass({ type: rType });
        expect(instance).not.toBeNull();
        expect(instance.type).toEqual(rType);
      }
    });
  });
  describe("unknown types", () => {
    it("should return null", () => {
      expect(() => getRelationClass({ class: "random" })).toThrowError();
    });
  });
  describe("empty type", () => {
    it("should return null", () => {
      expect(() => getRelationClass({})).toThrowError();
    });
  });
  describe("undefined input", () => {
    it("should return null", () => {
      expect(() => getRelationClass(undefined)).toThrowError();
    });
  });
});
