import "ts-jest";
import { ResponseStatement } from "./response";

describe("models/statement/response", function () {
  test("test ResponseStatement.sortListOfStatementItems", function () {
    const sorted = ResponseStatement.sortListOfStatementItems([
      {
        entityId: "1",
        linkId: "1",
        order: 1,
      },
      {
        entityId: "2",
        linkId: "2",
        order: false,
      },
      {
        entityId: "3",
        linkId: "3",
        order: 5,
      },
      {
        entityId: "4",
        linkId: "4",
        order: 3,
      },
      {
        entityId: "5",
        linkId: "5",
        order: 1,
      },
      {
        entityId: "6",
        linkId: "6",
        order: false
      },
    ]);

    expect(sorted.map(e => e.linkId)).toStrictEqual(["1", "5", "4", "3", "2", "6"]);
  });
});
