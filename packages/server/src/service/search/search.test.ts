import "ts-jest";
import { Db } from "@service/RethinkDB";
import AdvancedSearch from "./search";
import { Search } from "@shared/types/search";
import { EntityEnums } from "@shared/enums";
import { SearchEdge } from ".";
import { getEntitiesDataByClass } from "@service/shorthands";

const mockSearch = (rootType: Search.NodeType): AdvancedSearch => {
  return new AdvancedSearch({
    edges: [],
    operator: Search.NodeOperator.And,
    params: {},
    type: rootType,
  });
};

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

  describe("Basic node params search", () => {
    const search = mockSearch(Search.NodeType.A);
    search.root.params = { classes: [EntityEnums.Class.Territory] };

    beforeAll(async () => {
      await search.run(db.connection);
    });

    it("should return only Object entity types", async () => {
      const raw = await getEntitiesDataByClass(db, EntityEnums.Class.Territory);
      expect(raw.length).toEqual(search.results.length);
    });
  });
});
