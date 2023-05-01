import "ts-jest";
import { Db } from "@service/RethinkDB";
import { clean } from "@modules/common.test";
import AdvancedSearch from "./search";
import {
  SearchEdgeLogic,
  SearchEdgeType,
  SearchNodeOperator,
  SearchNodeType,
} from "@shared/types/search";

describe("test AdvancedSearch", () => {
  let db: Db;

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  afterAll(async () => {
    await db.close();
  });

  test("constructor", async () => {
    const s = new AdvancedSearch({
      operator: SearchNodeOperator.AND,
      type: SearchNodeType.A,
      edges: [
        {
          logic: SearchEdgeLogic.NEGATIVE,
          type: SearchEdgeType.HAS_PROPTYPE,
          params: {},
          node: {
            operator: SearchNodeOperator.AND,
            type: SearchNodeType.A,
            edges: [],
            params: {},
          },
        },
      ],
    });
  });
});
