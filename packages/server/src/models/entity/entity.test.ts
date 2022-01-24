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
