import "ts-jest";
import Territory from "./territory";

describe("Territory constructor test", function () {
  describe("empty data", () => {
    const emptyData = {};
    const emptyTerritory: Territory = Object.create(Territory.prototype);
    emptyTerritory.id = "";
    emptyTerritory.class = "T";
    emptyTerritory.label = "";
    emptyTerritory.data = {
      parent: false,
      type: "",
      content: "",
      lang: "",
    };
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
    fullTerritory.class = "T";
    fullTerritory.label = "label";
    fullTerritory.data = {
      parent: {
        id: "2",
        order: -1,
      },
      type: "type",
      content: "content",
      lang: "lang",
    };

    it("should return full territory", () => {
      const out = new Territory(fullData);
      expect(JSON.stringify(out)).toEqual(JSON.stringify(fullTerritory));
    });
  });
});
