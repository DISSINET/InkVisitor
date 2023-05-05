import "ts-jest";
import { Db } from "@service/RethinkDB";
import AdvancedSearch from "./search";
import { Search } from "@shared/types/search";

describe("test AdvancedSearch", () => {
  let db: Db;

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  afterAll(async () => {
    await db.close();
  });

  test("Search constructor", async () => {
    const s = new AdvancedSearch({
      operator: Search.NodeOperator.And,
      type: Search.NodeType.A,
      edges: [
        {
          logic: Search.EdgeLogic.Negative,
          type: Search.EdgeType.XHasProptype,
          params: {},
          node: {
            operator: Search.NodeOperator.And,
            type: Search.NodeType.A,
            edges: [],
            params: {},
          },
        },
      ],
    });
  });
});
