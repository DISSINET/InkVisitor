import "ts-jest";
import { Db } from "@service/rethink";
import QuerySearch from "./search";
import { Query } from "@shared/types/query";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { SearchEdge, SearchNode } from ".";
import { deleteEntities, getEntitiesDataByClass } from "@service/shorthands";
import { prepareEntity } from "@models/entity/entity.test";
import { prepareRelation } from "@models/relation/relation.test";

const mockSearch = (rootType: Query.NodeType): QuerySearch => {
  return new QuerySearch(
    {
      edges: [],
      operator: Query.NodeOperator.And,
      params: {},
      type: rootType,
      id: "root",
    },
    {
      view: {},
      columns: [],
      filters: [],
      sort: undefined,
      limit: 0,
      offset: 0,
    }
  );
};

describe("test QuerySearch", () => {
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
    const s = new QuerySearch(
      {
        type: Query.NodeType.A,
        params: {},
        operator: Query.NodeOperator.And,
        id: "1",
        edges: [
          {
            logic: Query.EdgeLogic.Negative,
            type: Query.EdgeType.XHasPropType,
            params: {},
            id: "2",
            node: {
              id: "3",
              operator: Query.NodeOperator.And,
              type: Query.NodeType.A,
              edges: [],
              params: {},
            },
          },
        ],
      },
      {
        view: {},
        columns: [],
        filters: [],
        sort: undefined,
        limit: 0,
        offset: 0,
      }
    );
  });

  describe("Test isValid", () => {
    test("empty search setup should be ok", () => {
      const node = new SearchNode({});
      expect(node.isValid()).toBeTruthy();
    });

    test("has_proptype should be ok if X-C relation", () => {
      const node = new SearchNode({ type: Query.NodeType.X });
      node.addEdge({ type: Query.EdgeType.XHasPropType }).node = new SearchNode(
        { type: Query.NodeType.C }
      );

      expect(node.isValid()).toBeTruthy();
    });

    test("has_proptype should be erroneous if not X-C relation (1)", () => {
      const node = new SearchNode({ type: Query.NodeType.C });
      node.addEdge({ type: Query.EdgeType.XHasPropType }).node = new SearchNode(
        { type: Query.NodeType.C }
      );

      expect(node.isValid()).toBeFalsy();
    });

    test("has_proptype should be erroneous if not X-C relation (2)", () => {
      const node = new SearchNode({ type: Query.NodeType.X });
      node.addEdge({ type: Query.EdgeType.XHasPropType }).node = new SearchNode(
        { type: Query.NodeType.X }
      );

      expect(node.isValid()).toBeFalsy();
    });
  });

  describe("Root params search", () => {
    const wantedClass = EntityEnums.Class.Territory;
    const [, entity1] = prepareEntity(wantedClass);
    const [, entity2] = prepareEntity(wantedClass);
    entity1.label = `${entity1.id}-label`;
    entity2.label = `${entity2.id}-label`;

    beforeAll(async () => {
      await entity1.save(db.connection);
      await entity2.save(db.connection);
    });

    it("should return all prepared T entities when searching by class param", async () => {
      const search = mockSearch(Query.NodeType.A);
      search.root.params.classes = [wantedClass];
      const results = await search.run(db.connection);
      expect(results).toBeTruthy();
      if (!results) {
        return;
      }
      const raw = await getEntitiesDataByClass(db.connection, wantedClass);
      expect(raw.length).toEqual(results.length);
    });

    it("should return only 1 prepared entity when searching by all params", async () => {
      const search = mockSearch(Query.NodeType.A);
      search.root.params = {
        classes: [wantedClass],
        id: entity1.id,
        label: entity1.label,
      };
      const results = await search.run(db.connection);
      expect(results).toBeTruthy();
      if (!results) {
        return;
      }
      expect(results.length).toEqual(1);
      expect(results[0]).toEqual(entity1.id);
    });
  });

  describe("Single edge search", () => {
    const [, entity1] = prepareEntity(EntityEnums.Class.Territory);
    entity1.id = `T${entity1.id}`;
    const [, entity2] = prepareEntity(EntityEnums.Class.Action);
    entity2.id = `A${entity2.id}`;
    const [, cEntity] = prepareEntity(EntityEnums.Class.Concept);
    cEntity.id = `C${cEntity.id}`;
    const [, invalidCEntity] = prepareEntity(EntityEnums.Class.Concept);
    invalidCEntity.id = `invalid${invalidCEntity.id}`;
    const [, cRel1] = prepareRelation(RelationEnums.Type.Classification);
    const [, cRel2] = prepareRelation(RelationEnums.Type.Classification);
    const [, cRel3] = prepareRelation(RelationEnums.Type.Classification);
    cRel1.entityIds = [entity1.id, cEntity.id];
    cRel2.entityIds = [entity2.id, cEntity.id];
    cRel3.entityIds = [invalidCEntity.id, entity2.id];

    beforeAll(async () => {
      await entity1.save(db.connection);
      await entity2.save(db.connection);
      await cEntity.save(db.connection);
      await invalidCEntity.save(db.connection);
      await cRel1.save(db.connection);
      await cRel2.save(db.connection);
      await cRel3.save(db.connection);
    });

    // should find 2 results - allowed classes are T & A (searching for first entity of Classification relation)
    it("should return both entities for XHasClassification edge", async () => {
      const search = mockSearch(Query.NodeType.X);
      search.root.addEdge({
        logic: Query.EdgeLogic.Positive,
        type: Query.EdgeType.XHasClassification,
        node: new SearchNode({
          type: Query.NodeType.C,
          operator: Query.NodeOperator.And,
          params: {
            classes: [EntityEnums.Class.Territory, EntityEnums.Class.Action],
          },
        }),
      });
      const results = await search.run(db.connection);
      expect(results).toBeTruthy();
      if (!results) {
        return;
      }
      console.log(results);
      expect(results).toHaveLength(2);
    });

    it("should return one entity for XHasClassification edge + node param", async () => {
      const search = mockSearch(Query.NodeType.X);
      const edge = search.root.addEdge({
        logic: Query.EdgeLogic.Positive,
        type: Query.EdgeType.XHasClassification,
      });
      edge.node = new SearchNode({
        type: Query.NodeType.C,
      });
      search.root.params.label = entity2.label;

      const results = await search.run(db.connection);
      expect(results).toBeTruthy();
      if (!results) {
        return;
      }
      expect(results).toHaveLength(1);
    });
  });

  describe("Multi edge search", () => {
    const wantedClass = EntityEnums.Class.Territory;
    const [, entity1] = prepareEntity(wantedClass);
    const [, entity2] = prepareEntity(wantedClass);
    const [, cEntity1] = prepareEntity(EntityEnums.Class.Concept);
    const [, cEntity2] = prepareEntity(EntityEnums.Class.Concept);

    const [, cRel1] = prepareRelation(RelationEnums.Type.Classification);
    const [, cRel2] = prepareRelation(RelationEnums.Type.Classification);
    const [, sRel] = prepareRelation(RelationEnums.Type.Superclass);

    cRel1.entityIds = [entity1.id, cEntity1.id];
    cRel2.entityIds = [entity2.id, cEntity1.id];
    sRel.entityIds = [cEntity1.id, cEntity2.id];

    beforeAll(async () => {
      await entity1.save(db.connection);
      await entity2.save(db.connection);
      await cEntity1.save(db.connection);
      await cEntity2.save(db.connection);
      await cRel1.save(db.connection);
      await cRel2.save(db.connection);
      await sRel.save(db.connection);
    });

    it("should return merged results (AND) from two edges", async () => {
      const search = mockSearch(Query.NodeType.X);
      search.root.addEdge({
        logic: Query.EdgeLogic.Positive,
        type: Query.EdgeType.XHasClassification,
        node: new SearchNode({
          type: Query.NodeType.C,
        }),
      });
      search.root.addEdge({
        logic: Query.EdgeLogic.Positive,
        type: Query.EdgeType.XHasRelation,
        node: new SearchNode({
          type: Query.NodeType.C,
        }),
      });
      const results = await search.run(db.connection);
      expect(results).toBeTruthy();
      if (!results) {
        return;
      }
      expect(results).toHaveLength(2);
    });

    it("should return merged results (OR) from two edges", async () => {
      const search = mockSearch(Query.NodeType.X);
      search.root.operator = Query.NodeOperator.Or;
      search.root.addEdge({
        logic: Query.EdgeLogic.Positive,
        type: Query.EdgeType.XHasClassification,
        node: new SearchNode({
          type: Query.NodeType.C,
        }),
      });
      search.root.addEdge({
        logic: Query.EdgeLogic.Positive,
        type: Query.EdgeType.XHasRelation,
        node: new SearchNode({
          type: Query.NodeType.C,
        }),
      });
      const results = await search.run(db.connection);
      expect(results).toBeTruthy();
      if (!results) {
        return;
      }
      expect(results).toHaveLength(4);
    });
  });
});
