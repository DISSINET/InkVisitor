import { expect } from "@modules/common.test";
import Statement from "./statement";

describe("Statement constructor test", function () {
  describe("empty data", () => {
    const emptyData = {};
    const emptyStatement: Statement = Object.create(Statement.prototype);
    emptyStatement.id = "";
    emptyStatement.class = "S";
    emptyStatement.label = "";
    emptyStatement.data = {
      action: "",
      certainty: "",
      elvl: "",
      modality: "",
      text: "",
      note: "",
      territory: {
        id: "",
        order: -1,
      },
      actants: [],
      props: [],
      references: [],
      tags: [],
    };

    it("should return empty statement", () => {
      const out = new Statement(emptyData);
      expect(JSON.stringify(out)).to.be.eq(JSON.stringify(emptyStatement));
    });
  });

  describe("ok data", () => {
    const fullData = {
      id: "id",
      class: "S",
      label: "label",
      data: {
        action: "action",
        certainty: "certainty",
        elvl: "elvl",
        modality: "modality",
        text: "text",
        note: "note",
        territory: {
          id: "id",
          order: 1,
        },
        actants: [],
        props: [],
        references: [],
        tags: [],
      },
    };
    const fullStatement: Statement = Object.create(Statement.prototype);
    fullStatement.id = "id";
    fullStatement.class = "S";
    fullStatement.label = "label";
    fullStatement.data = {
      action: "action",
      certainty: "certainty",
      elvl: "elvl",
      modality: "modality",
      text: "text",
      note: "note",
      territory: {
        id: "id",
        order: 1,
      },
      actants: [],
      props: [],
      references: [],
      tags: [],
    };

    it("should return full statement", () => {
      const out = new Statement(fullData);
      expect(JSON.stringify(out)).to.be.eq(JSON.stringify(fullStatement));
    });
  });
});
