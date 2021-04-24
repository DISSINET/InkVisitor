import { ActantType } from "@shared/enums";
import "ts-jest";
import Statement, { StatementTerritory } from "./statement";

describe("Statement constructor test", function () {
  describe("empty data", () => {
    const emptyData = {};
    const emptyStatement: Statement = Object.create(Statement.prototype);
    emptyStatement.id = "";
    emptyStatement.class = ActantType.Statement;
    emptyStatement.label = "";

    emptyStatement.data = Object.create(StatementTerritory.prototype);
    emptyStatement.data.action = "";
    emptyStatement.data.certainty = "";
    emptyStatement.data.elvl = "";
    emptyStatement.data.modality = "";
    emptyStatement.data.text = "";
    emptyStatement.data.note = "";

    emptyStatement.data.territory = Object.create(StatementTerritory.prototype);
    emptyStatement.data.territory.id = "";
    emptyStatement.data.territory.order = -1;

    emptyStatement.data.actants = [];
    emptyStatement.data.props = [];
    emptyStatement.data.references = [];
    emptyStatement.data.tags = [];

    it("should return empty statement", () => {
      const out = new Statement(emptyData);
      expect(out).toEqual(emptyStatement);
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
    fullStatement.class = ActantType.Statement;
    fullStatement.label = "label";
    fullStatement.data = Object.create(StatementTerritory.prototype);
    fullStatement.data.action = "action";
    fullStatement.data.certainty = "certainty";
    fullStatement.data.elvl = "elvl";
    fullStatement.data.modality = "modality";
    fullStatement.data.text = "text";
    fullStatement.data.note = "note";

    fullStatement.data.territory = Object.create(StatementTerritory.prototype);
    fullStatement.data.territory.id = "id";
    fullStatement.data.territory.order = 1;

    fullStatement.data.actants = [];
    fullStatement.data.props = [];
    fullStatement.data.references = [];
    fullStatement.data.tags = [];

    it("should return full statement", () => {
      const out = new Statement(fullData);
      expect(out).toEqual(fullStatement);
    });
  });
});

describe("Statement validate test", function () {
  describe("empty data", () => {
    it("should return true", () => {
      const emptyStatement = new Statement(undefined);
      expect(emptyStatement.isValid()).toEqual(false);
    });
  });
  describe("not empty data", () => {
    it("should return true", () => {
      const notEmpty = new Statement({
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
      });
      expect(notEmpty.isValid()).toEqual(true);
    });
  });
});
