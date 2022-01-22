import "ts-jest";
import Entity from "./entity";
import { ActantType } from "@shared/enums";

describe("test Entity constructor", function () {
  describe("one existing linked statement", () => {
    it("should correctly remove actant from statement's data.actants", async () => {
      const group = new Entity({ class: ActantType.Group });
      const object = new Entity({ class: ActantType.Object });
      const ter = new Entity({ class: ActantType.Territory });
      expect(group.class).toEqual(ActantType.Group);
      expect(object.class).toEqual(ActantType.Object);
      expect(ter.class).toEqual(ActantType.Territory);
    });
  });
});

describe("test Entity.toJSON", function () {
  const instance = new Entity({});
  for (const fieldName of Entity.publicFields) {
    (instance as any)[fieldName] = `value for ${fieldName}`;
  }
  const jsoned = JSON.parse(JSON.stringify(instance));
  const newKeys = Object.keys(jsoned);
  const newValues = Object.values(jsoned);

  it("should correctly map to public fields", () => {
    expect(newKeys).toEqual(Entity.publicFields);
  });

  it("should correctly assign values", () => {
    expect(newValues).toEqual(
      Entity.publicFields.map((fieldName) => (instance as any)[fieldName])
    );
  });
});
