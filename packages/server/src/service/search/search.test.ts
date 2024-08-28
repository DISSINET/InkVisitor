import "ts-jest";
import { Db } from "@service/RethinkDB";
import AdvancedSearch from "./search";
import { Search } from "@shared/types/search";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { SearchEdge, SearchNode } from ".";
import { deleteEntities, getEntitiesDataByClass } from "@service/shorthands";
import { prepareEntity } from "@models/entity/entity.test";
import { clean } from "@modules/common.test";
import Entity from "@models/entity/entity";
import { prepareRelation } from "@models/relation/relation.test";

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
          type: Search.EdgeType.XHasPropType,
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

  describe("Test isValid", () => {
    test("empty search setup should be ok", () => {
      const node = new SearchNode({});
      expect(node.isValid()).toBeTruthy();
    });

    test("has_proptype should be ok if X-C relation", () => {
      const node = new SearchNode({ type: Search.NodeType.X });
      node.addEdge({ type: Search.EdgeType.XHasPropType }).node =
        new SearchNode({ type: Search.NodeType.C });

      expect(node.isValid()).toBeTruthy();
    });

    test("has_proptype should be erroneous if not X-C relation (1)", () => {
      const node = new SearchNode({ type: Search.NodeType.C });
      node.addEdge({ type: Search.EdgeType.XHasPropType }).node =
        new SearchNode({ type: Search.NodeType.C });

      expect(node.isValid()).toBeFalsy();
    });

    test("has_proptype should be erroneous if not X-C relation (2)", () => {
      const node = new SearchNode({ type: Search.NodeType.X });
      node.addEdge({ type: Search.EdgeType.XHasPropType }).node =
        new SearchNode({ type: Search.NodeType.X });

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
      const search = mockSearch(Search.NodeType.A);
      search.root.params.classes = [wantedClass];
      const results = await search.run(db.connection);
      expect(results.items).toBeTruthy();
      if (!results.items) {
        return;
      }
      const raw = await getEntitiesDataByClass(db, wantedClass);
      expect(raw.length).toEqual(results.items.length);
    });

    it("should return only 1 prepared entity when searching by all params", async () => {
      const search = mockSearch(Search.NodeType.A);
      search.root.params = {
        classes: [wantedClass],
        id: entity1.id,
        label: entity1.label,
      };
      const results = await search.run(db.connection);
      expect(results.items).toBeTruthy();
      if (!results.items) {
        return;
      }
      expect(results.items.length).toEqual(1);
      expect(results.items[0].id).toEqual(entity1.id);
    });
  });

  describe("Single edge search", () => {
    const wantedClass = EntityEnums.Class.Territory;
    const [, entity1] = prepareEntity(wantedClass);
    const [, entity2] = prepareEntity(wantedClass);
    const [, cEntity] = prepareEntity(EntityEnums.Class.Concept);
    const [, cRel1] = prepareRelation(RelationEnums.Type.Classification);
    const [, cRel2] = prepareRelation(RelationEnums.Type.Classification);
    cRel1.entityIds = [entity1.id, cEntity.id];
    cRel2.entityIds = [entity2.id, cEntity.id];

    beforeAll(async () => {
      await entity1.save(db.connection);
      await entity2.save(db.connection);
      await cEntity.save(db.connection);
      await cRel1.save(db.connection);
      await cRel2.save(db.connection);
    });

    it("should return all prepared T entities when searching by class param", async () => {
      const search = mockSearch(Search.NodeType.S);
      search.root.params = { classes: [wantedClass] };
      const results = await search.run(db.connection);
      expect(results.items).toBeTruthy();
      if (!results.items) {
        return;
      }
      const raw = await getEntitiesDataByClass(db, wantedClass);
      expect(raw.length).toEqual(results.items.length);
    });

    it("should return only 1 prepared entity when searching by all params", async () => {
      const search = mockSearch(Search.NodeType.A);
      search.root.params = {
        classes: [wantedClass],
        id: entity1.id,
        label: entity1.label,
      };
      const results = await search.run(db.connection);
      expect(results.items).toBeTruthy();
      if (!results.items) {
        return;
      }
      expect(results.items).toHaveLength(1);
      expect(results.items[0].id).toEqual(entity1.id);
    });

    it("should return both entities for XHasClassification edge", async () => {
      const search = mockSearch(Search.NodeType.X);
      const edge = search.root.addEdge({
        logic: Search.EdgeLogic.Positive,
        type: Search.EdgeType.XHasClassification,
      });
      edge.node = new SearchNode({
        type: Search.NodeType.C,
      });
      const results = await search.run(db.connection);
      expect(results.items).toBeTruthy();
      if (!results.items) {
        return;
      }
      expect(results.items).toHaveLength(2);
    });

    it("should return one entity for XHasClassification edge + node param", async () => {
      const search = mockSearch(Search.NodeType.X);
      const edge = search.root.addEdge({
        logic: Search.EdgeLogic.Positive,
        type: Search.EdgeType.XHasClassification,
      });
      edge.node = new SearchNode({
        type: Search.NodeType.C,
      });
      search.root.params.label = entity2.label;

      const results = await search.run(db.connection);
      expect(results.items).toBeTruthy();
      if (!results.items) {
        return;
      }
      expect(results.items).toHaveLength(1);
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
      const search = mockSearch(Search.NodeType.X);
      const edge1 = search.root.addEdge({
        logic: Search.EdgeLogic.Positive,
        type: Search.EdgeType.XHasClassification,
      });
      edge1.node = new SearchNode({
        type: Search.NodeType.C,
      });
      const edge2 = search.root.addEdge({
        logic: Search.EdgeLogic.Positive,
        type: Search.EdgeType.XHasRelation,
      });
      edge2.node = new SearchNode({
        type: Search.NodeType.C,
      });
      const results = await search.run(db.connection);
      expect(results.items).toBeTruthy();
      if (!results.items) {
        return;
      }
      expect(results.items).toHaveLength(2);
    });

    it("should return merged results (OR) from two edges", async () => {
      const search = mockSearch(Search.NodeType.X);
      search.root.operator = Search.NodeOperator.Or;
      const edge1 = search.root.addEdge({
        logic: Search.EdgeLogic.Positive,
        type: Search.EdgeType.XHasClassification,
      });
      edge1.node = new SearchNode({
        type: Search.NodeType.C,
      });
      const edge2 = search.root.addEdge({
        logic: Search.EdgeLogic.Positive,
        type: Search.EdgeType.XHasRelation,
      });
      edge2.node = new SearchNode({
        type: Search.NodeType.C,
      });
      const results = await search.run(db.connection);
      expect(results.items).toBeTruthy();
      if (!results.items) {
        return;
      }
      expect(results.items).toHaveLength(4);
    });
  });
});
