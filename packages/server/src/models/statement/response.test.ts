import Action from "@models/action/action";
import Group from "@models/group/group";
import Person from "@models/person/person";
import { EntityEnums, StatementEnums } from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import "ts-jest";
import { ResponseStatement } from "./response";
import Statement, { StatementActant, StatementAction } from "./statement";
import { prepareStatement } from "./statement.test";

describe("models/statement/response", function () {
  test("test ResponseStatement.sortListOfStatementItems", function () {
    const sorted = ResponseStatement.sortListOfStatementItems([
      {
        entityId: "1",
        elementId: "1",
        type: StatementEnums.ElementType.Actant,
        order: 1,
      },
      {
        entityId: "2",
        elementId: "2",
        type: StatementEnums.ElementType.Actant,
        order: false,
      },
      {
        entityId: "3",
        elementId: "3",
        type: StatementEnums.ElementType.Actant,
        order: 5,
      },
      {
        entityId: "4",
        elementId: "4",
        type: StatementEnums.ElementType.Actant,
        order: 3,
      },
      {
        entityId: "5",
        elementId: "5",
        type: StatementEnums.ElementType.Actant,
        order: 1,
      },
      {
        entityId: "6",
        elementId: "6",
        type: StatementEnums.ElementType.Actant,
        order: false,
      },
    ]);

    expect(sorted.map((e) => e.elementId)).toStrictEqual([
      "1",
      "5",
      "4",
      "3",
      "2",
      "6",
    ]);
  });

  describe("test ResponseStatement.getWarnings", function () {
    test("not prepared entity should thrown an error", () => {
      const [, statement] = prepareStatement();
      const response = new ResponseStatement(statement);
      expect(() => response.getWarnings()).toThrowError(InternalServerError);
    });

    test("warningless statement response", () => {
      const statement = new Statement({ id: "statement" });
      const action1 = new Action({ id: "action1" });
      action1.data.entities.s = EntityEnums.PLOGESTRB;
      const action2 = new Action({ id: "action2" });
      action2.data.entities.s = EntityEnums.PLOGESTRB;
      statement.data.actions = [
        new StatementAction({ actionId: action1.id }),
        new StatementAction({ actionId: action2.id }),
      ];

      const person = new Person({ id: "person" });
      const group = new Group({ id: "group" });
      statement.data.actants = [
        new StatementActant({ entityId: person.id }),
        new StatementActant({ entityId: group.id }),
      ];

      const response = new ResponseStatement(statement);
      response.entities[statement.id] = statement;
      response.entities[action1.id] = action1;
      response.entities[action2.id] = action2;
      response.entities[person.id] = person;
      response.entities[group.id] = group;

      expect(response.getWarnings()).toHaveLength(0);
    });
  });
});
