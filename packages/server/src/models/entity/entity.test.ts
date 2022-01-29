import "ts-jest";
import Entity from "./entity";
import { EntityClass } from "@shared/enums";

describe("test Entity constructor", function () {
  describe("one existing linked statement", () => {
    it("should correctly remove actant from statement's data.actants", async () => {
      const group = new Entity({ class: EntityClass.Group });
      const object = new Entity({ class: EntityClass.Object });
      const ter = new Entity({ class: EntityClass.Territory });
      expect(group.class).toEqual(EntityClass.Group);
      expect(object.class).toEqual(EntityClass.Object);
      expect(ter.class).toEqual(EntityClass.Territory);
    });
  });
});
