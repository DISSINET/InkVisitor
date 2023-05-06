import "ts-jest";
import { Db } from "@service/RethinkDB";
import AdvancedSearch from "./search";
import { Search } from "@shared/types/search";
import { EntityEnums } from "@shared/enums";
import { SearchEdge } from ".";
import { deleteEntities, getEntitiesDataByClass } from "@service/shorthands";
import { prepareEntity } from "@models/entity/entity.test";
import { clean } from "@modules/common.test";

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
    await deleteEntities(db);
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

  describe("Root params search", () => {
    const search = mockSearch(Search.NodeType.A);
    const wantedClass = EntityEnums.Class.Territory;
    const [, entity1] = prepareEntity(wantedClass);
    const [, entity2] = prepareEntity(wantedClass);
    entity1.label = `${entity1.id}-label`;
    entity2.label = `${entity2.id}-label`;

    search.root.params = {
      classes: [wantedClass],
    };

    beforeAll(async () => {
      await entity1.save(db.connection);
      await entity2.save(db.connection);
    });

    it("should return all prepared T entities when searching by class param", async () => {
      const search = mockSearch(Search.NodeType.A);
      search.root.params = { classes: [wantedClass] };
      await search.run(db.connection);
      const raw = await getEntitiesDataByClass(db, wantedClass);
      expect(raw.length).toEqual(search.results.length);
    });

    it("should return only 1 prepared entity when searching by all params", async () => {
      const search = mockSearch(Search.NodeType.A);
      search.root.params = {
        classes: [wantedClass],
        id: entity1.id,
        label: entity1.label,
      };
      await search.run(db.connection);
      expect(search.results.length).toEqual(1);
      expect(search.results[0].id).toEqual(entity1.id);
    });
  });
});
