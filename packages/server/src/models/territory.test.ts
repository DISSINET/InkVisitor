import { ActantType } from "@shared/enums";
import "ts-jest";
import Territory, { TerritoryData, TerritoryParent } from "./territory";

describe("Territory constructor test", function () {
  describe("empty data", () => {
    const emptyData = {};
    const emptyTerritory: Territory = Object.create(Territory.prototype);
    emptyTerritory.id = "";
    emptyTerritory.class = ActantType.Territory;
    emptyTerritory.label = "";
    emptyTerritory.data = Object.create(TerritoryData.prototype);
    emptyTerritory.data.parent = false;
    emptyTerritory.data.type = "";
    emptyTerritory.data.content = "";
    emptyTerritory.data.lang = "";

    it("should return empty territory", () => {
      const out = new Territory(emptyData);
      expect(JSON.stringify(out)).toEqual(JSON.stringify(emptyTerritory));
    });
  });

  describe("ok data", () => {
    const fullData = {
      id: "id",
      class: "T",
      label: "label",
      data: {
        parent: {
          id: "2",
          order: -1,
        },
        type: "type",
        content: "content",
        lang: "lang",
      },
    };
    const fullTerritory: Territory = Object.create(Territory.prototype);
    fullTerritory.id = "id";
    fullTerritory.class = ActantType.Territory;
    fullTerritory.label = "label";
    fullTerritory.data = Object.create(TerritoryData.prototype);
    fullTerritory.data.parent = Object.create(TerritoryParent.prototype);
    (fullTerritory.data.parent as TerritoryParent).id = "2";
    (fullTerritory.data.parent as TerritoryParent).order = -1;
    fullTerritory.data.type = "type";
    fullTerritory.data.content = "content";
    fullTerritory.data.lang = "lang";

    it("should return full territory", () => {
      const out = new Territory(fullData);
      expect(JSON.stringify(out)).toEqual(JSON.stringify(fullTerritory));
    });
  });
});

describe("Territory validate test", function () {
  describe("empty data", () => {
    it("should return true", () => {
      const emptyTerritory = new Territory(undefined);
      expect(emptyTerritory.isValid()).toEqual(true);
    });
  });
  describe("ok data", () => {
    it("should return true", () => {
      const okData = new Territory({
        id: "id",
        class: "T",
        label: "label",
        data: {
          parent: {
            id: "2",
            order: 1,
          },
          type: "type",
          content: "content",
          lang: "lang",
        },
      });
      expect(okData.isValid()).toEqual(true);
    });
  });
});
