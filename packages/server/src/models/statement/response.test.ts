import { StatementEnums } from "@shared/enums";
import "ts-jest";
import { ResponseStatement } from "./response";

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
        order: false
      },
    ]);

    expect(sorted.map(e => e.elementId)).toStrictEqual(["1", "5", "4", "3", "2", "6"]);
  });
});
