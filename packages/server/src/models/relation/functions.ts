import { getRelationClass } from "@models/factory";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IRequest } from "src/custom_typings/request";
import { IEntity, Relation as RelationTypes } from "@inkvisitor/shared/types";
import { getEntitiesByIds } from "@service/shorthands";
import Entity from "@models/entity/entity";
import Territory from "@models/territory/territory";
import Relation from "./relation";
import Identification from "./identification";
import { Connection } from "rethinkdb-ts";
import { EntityTooltip } from "@inkvisitor/shared/types";

const MAX_NEST_LVL = 3;

// inverse direction of these relations yields "subordinate" entities: inverse
// SuperordinateEntity = subordinates, inverse Superclass = subclasses, inverse
// Holonym = meronyms. For all three the parent/whole is entityIds[1] and the
// subordinate is entityIds[0].
const SUBORDINATE_RELATION_TYPES: RelationEnums.Type[] = [
  RelationEnums.Type.SuperordinateEntity,
  RelationEnums.Type.Superclass,
  RelationEnums.Type.Holonym,
];

// safety bound on how many subordinates a single expansion collects
const SUBORDINATE_MAX_NODES = 1000;

/**
 * recursively search for action event trees
 * @param conn
 */
export const getActionEventNodes = async (
  conn: Connection,
  parentId: string,
  asClass: EntityEnums.Class,
  nestLvl = 0
): Promise<EntityTooltip.ISuperclassTree> => {
  const out: EntityTooltip.ISuperclassTree = {
    entityId: parentId,
    subtrees: [],
  };

  if (asClass === EntityEnums.Class.Action) {
    const relations: RelationTypes.IActionEventEquivalent[] =
      await Relation.findForEntities(
        conn,
        [parentId],
        RelationEnums.Type.ActionEventEquivalent,
        0
      );

    // make unique and sorted list of ids
    const subrootIds = [
      ...new Set(relations.map((r) => r.entityIds[1])),
    ].sort();

    for (const subparentId of subrootIds) {
      out.subtrees.push(
        await getSuperclassTrees(
          conn,
          subparentId,
          EntityEnums.Class.Concept,
          nestLvl + 1
        )
      );
    }
  }

  return out;
};

/**
 * recursively search for superclass relations
 * @param conn
 */
export const getSuperclassTrees = async (
  conn: Connection,
  parentId: string,
  asClass: EntityEnums.Class,
  nestLvl = 0
): Promise<EntityTooltip.ISuperclassTree> => {
  const out: EntityTooltip.ISuperclassTree = {
    entityId: parentId,
    subtrees: [],
  };

  if (nestLvl > MAX_NEST_LVL) {
    return out;
  }

  let relations: RelationTypes.IRelation[] = [];

  if (
    [EntityEnums.Class.Concept, EntityEnums.Class.Action].indexOf(asClass) !==
    -1
  ) {
    relations = await Relation.findForEntities(
      conn,
      [parentId],
      RelationEnums.Type.Superclass,
      0
    );
  } else if (EntityEnums.PLOGESTR.indexOf(asClass) !== -1) {
    relations = await Relation.findForEntities(
      conn,
      [parentId],
      RelationEnums.Type.Classification,
      0
    );
  }

  // make unique and sorted list of ids
  const subrootIds = [...new Set(relations.map((r) => r.entityIds[1]))].sort();

  for (const subparentId of subrootIds) {
    out.subtrees.push(
      await getSuperclassTrees(
        conn,
        subparentId,
        EntityEnums.Class.Concept,
        nestLvl + 1
      )
    );
  }

  return out;
};

/**
 * returns synonym cloud in the form of list containing grouped entity ids
 * @param conn
 * @returns
 */
export const getSynonymCloud = async (
  conn: Connection,
  asClass: EntityEnums.Class,
  entityId: string
): Promise<EntityTooltip.ISynonymCloud | undefined> => {
  let out: EntityTooltip.ISynonymCloud | undefined;

  if (
    asClass === EntityEnums.Class.Concept ||
    asClass === EntityEnums.Class.Action
  ) {
    const synonyms = await Relation.findForEntities<RelationTypes.ISynonym>(
      conn,
      [entityId],
      RelationEnums.Type.Synonym
    );

    out = synonyms.reduce(
      (acc, cur) => acc.concat(cur.entityIds),
      [] as string[]
    );
  }

  return out;
};

/**
 * returns synonym cloud in the form of list containing grouped entity ids
 * @param conn
 * @returns
 */
export const getIdentifications = async (
  conn: Connection,
  entityId: string
): Promise<EntityTooltip.IIdentification[]> => {
  const out: EntityTooltip.IIdentification[] = [];

  const identifications =
    await Relation.findForEntities<RelationTypes.IIdentification>(
      conn,
      [entityId],
      RelationEnums.Type.Identification
    );

  for (const relation of identifications) {
    out.push({
      certainty: relation.certainty,
      entityId:
        relation.entityIds[0] === entityId
          ? relation.entityIds[1]
          : relation.entityIds[0],
    });
  }

  return out;
};

/**
 * recursively search for superordinate location relations
 * @param conn
 */
export const getSuperordinateEntityTree = async (
  conn: Connection,
  asClass: EntityEnums.Class,
  parentId: string
): Promise<EntityTooltip.ISuperordinateEntityTree> => {
  const out: EntityTooltip.ISuperordinateEntityTree = {
    entityId: parentId,
    subtrees: [],
  };

  if (asClass === EntityEnums.Class.Location) {
    const locations: RelationTypes.ISuperordinateEntity[] =
      await Relation.findForEntities(
        conn,
        [parentId],
        RelationEnums.Type.SuperordinateEntity,
        0
      );

    // make unique and sorted list of ids
    const subrootIds = [
      ...new Set(locations.map((r) => r.entityIds[1])),
    ].sort();

    for (const subparentId of subrootIds) {
      out.subtrees.push(
        await getSuperordinateEntityTree(conn, asClass, subparentId)
      );
    }
  }

  return out;
};

export const getEntityIdsFromTree = (
  tree: EntityTooltip.ISuperordinateEntityTree
): string[] => {
  const out: string[] = [tree.entityId];

  for (const subtree of tree.subtrees) {
    out.push(...getEntityIdsFromTree(subtree));
  }

  return out;
};

/**
 * Recreates relations of chosen type(s) for another entity
 * @param request
 * @param originalEntity
 * @param targetEntity
 * @param types
 */
export const copyRelations = async (
  request: IRequest,
  originalEntity: string,
  targetEntity: string,
  types: RelationEnums.Type[]
): Promise<void> => {
  const relations = await Relation.findForEntities(request.db.connection, [
    originalEntity,
  ]);

  for (let i = 0; i < relations.length; i++) {
    const relation = getRelationClass(relations[i]);
    if (types.indexOf(relation.type) === -1) {
      continue;
    }

    // relation should be created anew
    relation.id = "";

    // replace template id with this.id
    relation.entityIds = relation.entityIds.map((id) =>
      id === originalEntity ? targetEntity : id
    );

    await relation.beforeSave(request);
    await relation.save(request.db.connection);
    await relation.afterSave(request);
  }
};

/**
 * Pure tree-walk: collects every entity id referenced by a list of
 * identification connections (including their transitive `subtrees`) into `acc`.
 * Extracted so it can be unit-tested without a DB connection.
 * @param connections forward identification connection trees
 * @param acc set accumulating the collected entity ids
 * @returns the (mutated) accumulator set
 */
export const collectIdsFromIdentificationConnections = (
  connections: RelationTypes.IConnection<RelationTypes.IIdentification>[],
  acc: Set<string> = new Set<string>()
): Set<string> => {
  for (const connection of connections) {
    for (const id of connection.entityIds) {
      acc.add(id);
    }
    if (connection.subtrees && connection.subtrees.length) {
      collectIdsFromIdentificationConnections(connection.subtrees, acc);
    }
  }
  return acc;
};

/**
 * Returns the set of entity ids considered "equivalent" to the input entities,
 * used by the "include equivalents" search option (#2969). Equivalence covers:
 *  - SYN (Synonym): the full synonym cloud. Clouds are merged at save time, so a
 *    single batched lookup already yields the transitive set.
 *  - AEE (ActionEventEquivalent): single hop, both directions (Action<->Concept),
 *    not transitive.
 *  - IDE (Identification): mirrors the detail-view traversal - direct
 *    identifications of any certainty, followed transitively only through
 *    `Certain` ones (depth-capped).
 * The original input ids are removed from the result.
 * @param conn db connection
 * @param entityIds source entity ids to expand
 * @returns unique equivalent entity ids, excluding the inputs
 */
export const getEquivalentEntityIds = async (
  conn: Connection,
  entityIds: string[]
): Promise<string[]> => {
  const result = new Set<string>();

  if (!entityIds.length) {
    return [];
  }

  // SYN (full transitive cloud) and AEE (single hop, both directions): batched,
  // just flatten the related ids
  for (const type of [
    RelationEnums.Type.Synonym,
    RelationEnums.Type.ActionEventEquivalent,
  ]) {
    const relations = await Relation.findForEntities(conn, entityIds, type);
    for (const relation of relations) {
      for (const id of relation.entityIds) {
        result.add(id);
      }
    }
  }

  // IDE - per-entity transitive traversal (mirrors detail view), run in parallel
  const identificationTrees = await Promise.all(
    entityIds.map((entityId) =>
      Identification.getIdentificationForwardConnections(
        conn,
        entityId,
        MAX_NEST_LVL,
        1,
        []
      )
    )
  );
  for (const tree of identificationTrees) {
    collectIdsFromIdentificationConnections(tree, result);
  }

  // never return the inputs themselves
  for (const id of entityIds) {
    result.delete(id);
  }

  return [...result];
};

/**
 * Returns the set of entity ids considered "subordinate" to the input entities,
 * used by the "include subordinates" search option (#2969). Subordinates are the
 * inverse/downward direction, followed to all levels:
 *  - inverse SCL (Superclass): subclasses
 *  - inverse SOE (SuperordinateEntity): subordinate entities
 *  - inverse HOL (Holonym): meronyms
 *  - child Territories (all levels) when an input is a Territory
 * The relation traversal is a batched, cycle-safe BFS bounded by
 * SUBORDINATE_MAX_NODES. The territory closure is unbounded - it is a walk over
 * the in-memory tree cache, and the query edges that expand a Territory target
 * ("S under T", "entities used under T") treat it as the complete subtree.
 * The input ids are removed from the result.
 * @param conn db connection
 * @param entityIds source entity ids to expand
 * @returns unique subordinate entity ids, excluding the inputs
 */
export const getSubordinateEntityIds = async (
  conn: Connection,
  entityIds: string[]
): Promise<string[]> => {
  if (!entityIds.length) {
    return [];
  }

  const visited = new Set<string>(entityIds); // guards against cycles / re-visits
  const collected = new Set<string>(); // subordinates only (inputs excluded)

  const inputEntities = await Entity.findEntitiesByIds(conn, entityIds);
  const territoryInputs = inputEntities.filter(
    (entity) => entity.class === EntityEnums.Class.Territory
  );

  // SCL/SOE/HOL admit no Territory on either side (RelationRules in
  // shared/types/relation.ts), so an all-territory input can only expand through
  // the tree walk below and the relation queries are guaranteed to come back empty
  if (territoryInputs.length !== inputEntities.length) {
    // inverse SCL/SOE/HOL, all levels, batched one query per type per BFS level
    let frontier = [...new Set(entityIds)];
    while (frontier.length && collected.size < SUBORDINATE_MAX_NODES) {
      const relationsPerType = await Promise.all(
        SUBORDINATE_RELATION_TYPES.map((type) =>
          Relation.findForEntities(conn, frontier, type, 1)
        )
      );

      const next: string[] = [];
      for (const relations of relationsPerType) {
        for (const relation of relations) {
          const subordinateId = relation.entityIds[0];
          if (!visited.has(subordinateId)) {
            visited.add(subordinateId);
            collected.add(subordinateId);
            next.push(subordinateId);
          }
        }
      }
      frontier = next;
    }
  }

  // child territories (all levels) of any input that is itself a Territory.
  // findChilds(deep) walks the in-memory treeCache, so this closure sits outside
  // the SUBORDINATE_MAX_NODES budget that bounds the DB-backed relation BFS: it
  // is what "include subordinates" means for a Territory, and a negated edge
  // subtracts it from the result, so a partial set leaves statements behind
  const childSets = await Promise.all(
    territoryInputs.map((entity) =>
      new Territory({ id: entity.id }).findChilds(conn, true)
    )
  );
  for (const childs of childSets) {
    for (const child of Object.values(childs)) {
      if (child.id && !visited.has(child.id)) {
        visited.add(child.id);
        collected.add(child.id);
      }
    }
  }

  return [...collected];
};
