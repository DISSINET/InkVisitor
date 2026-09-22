import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation as RelationTypes } from "@inkvisitor/shared/types";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import { Query } from "@inkvisitor/shared/types/query";
import { getSubordinateEntityIds } from "@models/relation/functions";
import treeCache from "@service/treeCache";
import { Connection, r, RDatum, RStream, RValue } from "rethinkdb-ts";
import { SearchNode } from ".";
import { getNodeExpansionIds } from "./node-expansion";

export default class SearchEdge implements Query.IEdge {
  type: Query.EdgeType;
  params: Query.IEdgeParams;
  logic: Query.EdgeLogic;
  id: string;
  node: SearchNode;

  constructor(data: Partial<Query.IEdge>) {
    this.type = data.type || ("" as Query.EdgeType);
    this.params = data.params || {};
    this.logic = data.logic || Query.EdgeLogic.Positive;
    this.node = new SearchNode(data?.node || {});
    this.id = data.id || "";
  }

  /**
   * Explicit target-id set for the edge, resolved in prepare(): for a pinned
   * target node the pinned entityId plus its equivalents (SYN/AEE/IDE) and/or
   * subordinates (inverse SCL/SOE/HOL + child territories, all levels) when the
   * node's expansion toggles ask for them; for an unpinned node the entities
   * matching its status constraint. Null when the target is neither pinned nor
   * status-constrained - expansion toggles never affect an unpinned target.
   */
  protected targetEntityIds: string[] | null = null;

  /**
   * True for edges whose run() checks an unpinned target's statuses on each
   * candidate itself. prepare() then leaves the status constraint out of the
   * target-id set.
   */
  protected checksUnpinnedTargetStatusInRun = false;

  /**
   * Classes the edge's target can hold - the target picker's classes from
   * EdgeTypeTargetNodeParams - used to narrow the status lookup through the
   * class index when the target node picks no class. Empty for targets of any
   * class, which leaves that lookup a full entity-table scan.
   */
  private statusTargetClasses(): EntityEnums.Class[] {
    return Query.EdgeTypeTargetNodeParams[this.type]?.entityId?.allowedClasses ?? [];
  }

  /**
   * Async precomputation hook, invoked by the node evaluator before run().
   * run() only composes synchronous ReQL, so anything fetched ahead of time
   * (the expanded target-id set here) is resolved here. Subclasses overriding
   * prepare() must call super.prepare() so the target expansion stays resolved.
   */
  async prepare(db: Connection): Promise<void> {
    const entityId = this.node.params.entityId;
    const statuses = this.node.params.entityStatuses ?? [];

    if (!entityId) {
      // resolving the status constraint into an id set here is what makes it
      // apply to every edge type: each run() already matches against
      // targetIds(), so no edge needs to know about statuses
      this.targetEntityIds =
        statuses.length && !this.checksUnpinnedTargetStatusInRun
          ? await this.statusTargetIds(db, statuses)
          : null;
      return;
    }

    // both toggles off -> single-id set, no expansion queries issued.
    // The same resolver backs the /entities/:id/expansion route, so what the
    // query builder displays is the set this edge matches against.
    const expansion = await getNodeExpansionIds(db, entityId, {
      equivalents: this.node.params.includeEquivalents === true,
      subordinates: this.node.params.includeSubordinates === true,
    });
    const ids = [entityId, ...expansion.equivalents, ...expansion.subordinates];
    this.targetEntityIds = statuses.length ? await filterIdsByStatus(db, ids, statuses) : ids;
  }

  /**
   * Ids of entities carrying one of `statuses`, narrowed by the target node's
   * classes, else by the classes the edge's target can hold. Status has no
   * index, so without either this is a full scan of the entity table.
   */
  private async statusTargetIds(db: Connection, statuses: EntityEnums.Status[]): Promise<string[]> {
    const nodeClasses = this.node.params.entityClasses ?? [];
    const classes = nodeClasses.length ? nodeClasses : this.statusTargetClasses();
    const base: RStream = classes.length
      ? r.table(Entity.table).getAll(r.args(classes), { index: DbEnums.Indexes.Class })
      : r.table(Entity.table);

    return filterStreamByStatus(base, statuses).run(db) as Promise<string[]>;
  }

  /**
   * Target-id set for run() call sites to match against, null when the target
   * is unconstrained. A pinned target always contains at least the pinned id; a
   * status-constrained one may resolve to an empty set, which every run()
   * treats as "matches nothing". Falls back to the raw params.entityId when
   * prepare() has not run, so a bare run() keeps the single-id semantics.
   */
  protected targetIds(): string[] | null {
    if (this.targetEntityIds) {
      return this.targetEntityIds;
    }
    const entityId = this.node.params.entityId;
    return entityId ? [entityId] : null;
  }

  run(q: RStream): RStream {
    throw new Error("base SearchEdge does not implement run method");
  }
}

/**
 * Narrows a stream of entities to those carrying one of `statuses` and emits
 * their distinct ids.
 */
function filterStreamByStatus(q: RStream, statuses: EntityEnums.Status[]): RStream {
  return q
    .filter(function (e: RDatum<IEntity>) {
      return r.expr(statuses).contains(e("status"));
    })
    .getField("id")
    .distinct() as unknown as RStream;
}

/**
 * Subset of `ids` whose entities carry one of `statuses`.
 */
async function filterIdsByStatus(
  db: Connection,
  ids: string[],
  statuses: EntityEnums.Status[]
): Promise<string[]> {
  if (!ids.length) {
    return ids;
  }
  return filterStreamByStatus(r.table(Entity.table).getAll(r.args(ids)), statuses).run(
    db
  ) as Promise<string[]>;
}

/**
 * Intersects a precomputed candidate-id stream back into the incoming stream q:
 * dedupes `idsStream`, coerces it to an array and emits only the ids already
 * present in q - the subset invariant that positive matching and negation
 * (base set minus matches) both rely on. Pass null when the edge has no usable
 * target - the edge then matches nothing.
 */
function intersectIdsWithStream(q: RStream, idsStream: RStream | null): RStream {
  const idsArray: RDatum = idsStream
    ? (idsStream.distinct() as unknown as RDatum).coerceTo("array")
    : r.expr([] as string[]);

  return idsArray.do(function (ids: RDatum) {
    return q
      .filter(function (e: RDatum<IEntity>) {
        return ids.contains(e("id"));
      })
      .map(function (e: RDatum<IEntity>) {
        return e("id");
      });
  }) as unknown as RStream;
}

export class EdgeSUnderT extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["SUT:"];
  }

  run(q: RStream): RStream {
    const targetIds = this.targetIds();

    // the target set is the pinned territory plus whatever its expansion toggles
    // add - "include subordinates" of a Territory is its whole subtree, so this
    // set has no upper bound and is pulled through the StatementTerritory index
    // rather than membership-tested per row of the incoming stream. Intersecting
    // back with q keeps the subset invariant that positive matching and negation
    // both rely on; no target matches nothing
    return intersectIdsWithStream(
      q,
      targetIds && targetIds.length
        ? (r
            .table(Entity.table)
            .getAll(r.args(targetIds), {
              index: DbEnums.Indexes.StatementTerritory,
            })
            .filter(function (e: RDatum<IEntity>) {
              return e("class").eq(EntityEnums.Class.Statement);
            })
            .getField("id") as unknown as RStream)
        : null
    );
  }
}

/**
 * Ancestors of `territoryId`, root-first, from the path the tree cache keeps
 * per territory (populateTree) - no tree is walked here. The path excludes the
 * territory itself, so its last entry is the direct parent and an empty path
 * means the territory is the root, with nothing above it. `depth` limits it to
 * the direct parent.
 */
function territoryAncestorIds(
  territoryId: string | undefined,
  depth: "direct" | "any"
): string[] {
  const path = territoryId ? (treeCache.tree.idMap[territoryId]?.path ?? []) : [];
  return depth === "any" ? path : path.slice(-1);
}

/**
 * Shared run for the "T has child T" edges (CT: / CT:D). Matches Territories
 * that hold the pinned target Territory below them - the target's ancestors,
 * either all of them or just its direct parent. These climb towards the root
 * rather than descending, which is why they are two edges instead of one edge
 * plus the SUB toggle: that toggle widens downwards everywhere else.
 */
function runTerritoryHasChildEdge(
  q: RStream,
  territoryId: string | undefined,
  depth: "direct" | "any"
): RStream {
  const ancestorIds = territoryAncestorIds(territoryId, depth);

  return intersectIdsWithStream(
    q,
    ancestorIds.length ? (r.expr(ancestorIds) as unknown as RStream) : null
  );
}

export class EdgeTerritoryHasChild extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["CT:"];
  }

  run(q: RStream): RStream {
    return runTerritoryHasChildEdge(q, this.node.params.entityId, "any");
  }
}

export class EdgeTerritoryHasDirectChild extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["CT:D"];
  }

  run(q: RStream): RStream {
    return runTerritoryHasChildEdge(q, this.node.params.entityId, "direct");
  }
}

/**
 * I_CT: ("T has parent T"). Matches Territories sitting below the pinned target
 * Territory: with the SUB toggle on, its whole subtree - what "include
 * subordinates" already resolves to for a Territory - and with it off, only its
 * direct children, read per row off data.parent. The root territory carries
 * `parent: false` rather than an object, hence the type check.
 */
export class EdgeTerritoryHasParent extends SearchEdge {
  protected descendantIds: string[] | null = null;

  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_CT:"];
  }

  private anyDepth(): boolean {
    return this.node.params.includeSubordinates === true;
  }

  async prepare(db: Connection): Promise<void> {
    const targetId = this.node.params.entityId;
    this.descendantIds =
      targetId && this.anyDepth()
        ? await getSubordinateEntityIds(db, [targetId])
        : null;
  }

  run(q: RStream): RStream {
    const targetId = this.node.params.entityId;
    if (!targetId) {
      return intersectIdsWithStream(q, null);
    }

    if (this.anyDepth()) {
      const ids = this.descendantIds;
      return intersectIdsWithStream(
        q,
        ids && ids.length ? (r.expr(ids) as unknown as RStream) : null
      );
    }

    return q
      .filter(function (e: RDatum<IEntity>) {
        return r.and(
          e("data")("parent").typeOf().eq("OBJECT"),
          e("data")("parent")("territoryId").eq(targetId)
        );
      })
      .map(function (e) {
        return e("id");
      });
  }
}

/**
 * I_SUT: ("T has S"). A statement sits under exactly one direct territory, so
 * unlike SUT: this has no subtree to expand - it just reads the pinned
 * Statement's own data.territory.territoryId and matches the Territory (at
 * most one) with that id. Intersected back with q, keeping the subset
 * invariant that positive matching and negation both rely on. With no target
 * the edge matches nothing.
 */
export class EdgeTerritoryHasStatement extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_SUT:"];
  }

  run(q: RStream): RStream {
    const statementIds = this.targetIds();

    return intersectIdsWithStream(
      q,
      statementIds && statementIds.length
        ? (r
            .table(Entity.table)
            .getAll(r.args(statementIds))
            .filter(function (e: RDatum<IEntity>) {
              return e("class").eq(EntityEnums.Class.Statement);
            })
            .concatMap(function (e: RDatum) {
              return r.branch(
                e("data").hasFields("territory"),
                [e("data")("territory")("territoryId")],
                []
              );
            }) as unknown as RStream)
        : null
    );
  }
}

/**
 * Whether an existing entity has one of `classes` and one of `statuses`; an
 * empty list does not constrain.
 */
function entityMatchesClassesAndStatuses(
  ent: RDatum,
  classes: EntityEnums.Class[],
  statuses: EntityEnums.Status[]
): RDatum {
  return r.and(
    classes.length ? r.expr(classes).contains(ent("class")) : true,
    statuses.length ? r.expr(statuses).contains(ent("status").default(null)) : true
  );
}

/**
 * Shared run for the directed relation edges. A forward edge walks from the
 * iterated entity (entityIds[0]) to its relation target (entityIds[1]): R:SCL
 * (Superclass), R:SOE (SuperordinateEntity) and ORDERED_RELATION_EDGES. An
 * inverse edge walks the other way, from the iterated entity at entityIds[1] to
 * entityIds[0]: I_R:SCL (subclasses), I_R:SOE (subordinates), I_R:CLA
 * (instances), I_R:HOL (meronyms). Matches relations of `relationType` where the
 * far side satisfies the edge target:
 *  - any id of the pinned target-id set (`targetIds`, the pinned entity plus
 *    its toggle-driven expansion), or
 *  - any entity whose class is in `targetClasses` and whose status is in
 *    `targetStatuses` (empty suggester; an empty list does not constrain), or
 *  - with neither, any relation of the type.
 * The class/status check reads the far-side entity by primary key per relation,
 * so its cost does not grow with how many entities carry that class and status.
 * Emits the iterated entity itself, keeping the subset invariant positive
 * matching and negation rely on. A dangling target entity id (no such entity)
 * is null-safe and simply fails the class/status condition.
 */
function runRelationTargetEdge(
  q: RStream,
  relationType: RelationEnums.Type,
  targetIds: string[] | null,
  targetClasses: EntityEnums.Class[],
  targetStatuses: EntityEnums.Status[],
  inverse = false
): RStream {
  const sourceIndex = inverse ? 1 : 0;
  const targetIndex = inverse ? 0 : 1;

  return q.concatMap(function (entity: RDatum<IEntity>) {
    return (
      r
        .table(Relation.table)
        .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
        .filter({
          type: relationType,
        })
        // keep relations where the iterated entity sits on the source side
        // (for R:SOE entityIds[0] is the subordinate; its superordinate is
        // entityIds[1], mirroring SuperordinateEntity.getSuperordinate...
        // ForwardConnections, which recurses on entityIds[1])
        .filter(function (relation: RDatum<RelationTypes.IRelation>) {
          return relation("entityIds").nth(sourceIndex).eq(entity("id"));
        })
        // check if the target entity is one of the desired ones
        .filter(function (relation: RDatum<RelationTypes.IRelation>) {
          if (targetIds) {
            return r.expr(targetIds).contains(relation("entityIds").nth(targetIndex));
          }
          if (targetClasses.length || targetStatuses.length) {
            return r
              .table(Entity.table)
              .get(relation("entityIds").nth(targetIndex))
              .default(null)
              .do(function (ent: RDatum) {
                return r.branch(
                  ent,
                  entityMatchesClassesAndStatuses(ent, targetClasses, targetStatuses),
                  false
                );
              });
          }
          return true;
        })
        .map(function (relation) {
          return relation("entityIds").nth(sourceIndex);
        })
    );
  });
}

/**
 * Base for relation edges that check an unpinned target's statuses in run(), on
 * each relation's far-side entity next to its class: resolving them in prepare()
 * loads every entity of the target class and status into a list that run() then
 * scans once per relation. A pinned target keeps its statuses in the (small)
 * target-id set, so it gets no statuses here.
 */
abstract class RelationTargetSearchEdge extends SearchEdge {
  protected checksUnpinnedTargetStatusInRun = true;

  protected unpinnedTargetStatuses(): EntityEnums.Status[] {
    return this.node.params.entityId ? [] : this.node.params.entityStatuses ?? [];
  }

  protected runRelationTarget(
    q: RStream,
    relationType: RelationEnums.Type,
    inverse = false
  ): RStream {
    return runRelationTargetEdge(
      q,
      relationType,
      this.targetIds(),
      this.node.params.entityClasses ?? [],
      this.unpinnedTargetStatuses(),
      inverse
    );
  }
}

export class EdgeHasRelation extends RelationTargetSearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:"];
  }

  /**
   * Matches entities in a relation of any type whose other members satisfy the
   * edge target: a pinned target-id set, else the class/status of any partner
   * (see relationPartners), else any relation at all.
   */
  run(q: RStream): RStream {
    const targetIds = this.targetIds();
    const targetClasses = this.node.params.entityClasses ?? [];
    const targetStatuses = this.unpinnedTargetStatuses();

    return q.concatMap(function (entity: RDatum<IEntity>) {
      return (
        r
          .table(Relation.table)
          .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
          .filter(function (relation: RDatum<RelationTypes.IRelation>) {
            return relation("entityIds").contains(entity("id"));
          })
          .filter(function (relation: RDatum<RelationTypes.IRelation>) {
            if (targetIds) {
              return relation("entityIds").setIntersection(r.expr(targetIds)).isEmpty().not();
            }
            if (targetClasses.length || targetStatuses.length) {
              // relation types differ in whether an entity may be its own
              // partner, so a self loop counts wherever the data holds one
              return relationPartners(relation, entity("id"), true).contains(function (
                id: RDatum<string>
              ) {
                return r
                  .table(Entity.table)
                  .get(id)
                  .default(null)
                  .do(function (ent: RDatum) {
                    return r.branch(
                      ent,
                      entityMatchesClassesAndStatuses(ent, targetClasses, targetStatuses),
                      false
                    );
                  });
              });
            }
            return true;
          })
          // emit the iterated entity itself (it participates in a qualifying
          // relation) instead of the relation's first member - this keeps the
          // result a subset of the input stream, which positive matching and
          // negation (base set minus matches) both rely on
          .map(function () {
            return entity("id");
          })
      );
    });
  }
}

export class EdgeCHasSuperclass extends RelationTargetSearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:SCL"];
  }

  run(q: RStream): RStream {
    return this.runRelationTarget(q, RelationEnums.Type.Superclass);
  }
}

export class EdgeHasSubclass extends RelationTargetSearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_R:SCL"];
  }

  run(q: RStream): RStream {
    return this.runRelationTarget(q, RelationEnums.Type.Superclass, true);
  }
}

export class EdgeHasSuperordinate extends RelationTargetSearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:SOE"];
  }

  run(q: RStream): RStream {
    return this.runRelationTarget(q, RelationEnums.Type.SuperordinateEntity);
  }
}

/**
 * Members of `relation` that the iterated entity is related TO. Every occurrence
 * of the entity's own id is dropped, so a symmetric pair yields just the other
 * side no matter which index the entity sits at.
 *
 * A `selfLoop` relation may legitimately hold the entity as its own partner, in
 * which case its id occupies BOTH slots - the entity is put back only when it
 * appears more than once, so an ordinary pair still cannot match itself.
 */
function relationPartners(
  relation: RDatum<RelationTypes.IRelation>,
  entityId: RDatum<string>,
  selfLoop: boolean
): RDatum {
  const others = relation("entityIds").filter(function (id: RDatum<string>) {
    return id.ne(entityId);
  });
  if (!selfLoop) {
    return others as unknown as RDatum;
  }
  return r.branch(
    relation("entityIds")
      .filter(function (id: RDatum<string>) {
        return id.eq(entityId);
      })
      .count()
      .gt(1),
    others.append(entityId),
    others
  ) as unknown as RDatum;
}

/**
 * Shared run for the forward relation edges whose entityIds carry no direction:
 * the symmetric pairs (ANT, PRR, SAR, IDE, REL) and the Synonym cloud, where the
 * iterated entity can sit at any index. Matches relations of `relationType` that
 * contain the iterated entity and whose partners (see relationPartners) satisfy
 * the edge target:
 *  - any id of the pinned target-id set (`targetIds`, the pinned entity plus its
 *    toggle-driven expansion), or
 *  - any entity whose class is in `targetClasses` and whose status is in
 *    `targetStatuses` (empty suggester; an empty list does not constrain), or
 *  - with neither, any relation of the type that has a partner at all.
 * Emits the iterated entity, keeping the subset invariant positive matching and
 * negation rely on. A dangling partner id (no such entity) is null-safe and
 * simply fails the class/status condition.
 */
function runHasUnorderedRelationEdge(
  q: RStream,
  relationType: RelationEnums.Type,
  targetIds: string[] | null,
  targetClasses: EntityEnums.Class[],
  targetStatuses: EntityEnums.Status[],
  selfLoop: boolean
): RStream {
  return q.concatMap(function (entity: RDatum<IEntity>) {
    return r
      .table(Relation.table)
      .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
      .filter({
        type: relationType,
      })
      .filter(function (relation: RDatum<RelationTypes.IRelation>) {
        return relation("entityIds").contains(entity("id"));
      })
      .filter(function (relation: RDatum<RelationTypes.IRelation>) {
        const partners = relationPartners(relation, entity("id"), selfLoop);

        if (targetIds) {
          return partners.setIntersection(r.expr(targetIds)).isEmpty().not();
        }
        if (targetClasses.length || targetStatuses.length) {
          return partners.contains(function (id: RDatum<string>) {
            return r
              .table(Entity.table)
              .get(id)
              .default(null)
              .do(function (ent: RDatum) {
                return r.branch(
                  ent,
                  entityMatchesClassesAndStatuses(ent, targetClasses, targetStatuses),
                  false
                );
              });
          });
        }
        return partners.isEmpty().not();
      })
      .map(function () {
        return entity("id");
      });
  });
}

/**
 * Relations whose entityIds are ordered [source, target]: the edge walks from
 * the iterated entity at entityIds[0] to its target at entityIds[1]. The three
 * relations that predate this map (Superclass, SuperordinateEntity,
 * Classification) keep their own named classes.
 */
const ORDERED_RELATION_EDGES: Partial<Record<Query.EdgeType, RelationEnums.Type>> = {
  [Query.EdgeType["R:HOL"]]: RelationEnums.Type.Holonym,
  [Query.EdgeType["R:AEE"]]: RelationEnums.Type.ActionEventEquivalent,
  [Query.EdgeType["R:IMP"]]: RelationEnums.Type.Implication,
  [Query.EdgeType["R:SUS"]]: RelationEnums.Type.SubjectSemantics,
  [Query.EdgeType["R:A1S"]]: RelationEnums.Type.Actant1Semantics,
  [Query.EdgeType["R:A2S"]]: RelationEnums.Type.Actant2Semantics,
};

/**
 * Relations that put no meaning on the entityIds order - the symmetric pairs and
 * the Synonym cloud (Relation.RelationRules: asymmetrical false / cloudType).
 * The iterated entity can sit at any index, so these walk partners instead of
 * entityIds[1].
 */
const UNORDERED_RELATION_EDGES: Partial<Record<Query.EdgeType, RelationEnums.Type>> = {
  [Query.EdgeType["R:SYN"]]: RelationEnums.Type.Synonym,
  [Query.EdgeType["R:ANT"]]: RelationEnums.Type.Antonym,
  [Query.EdgeType["R:PRR"]]: RelationEnums.Type.PropertyReciprocal,
  [Query.EdgeType["R:SAR"]]: RelationEnums.Type.SubjectActant1Reciprocal,
  [Query.EdgeType["R:IDE"]]: RelationEnums.Type.Identification,
  [Query.EdgeType["R:REL"]]: RelationEnums.Type.Related,
};

/**
 * Ordered relations whose inverse edge type is implemented: the edge walks
 * from entityIds[1] back to entityIds[0], the opposite direction from
 * ORDERED_RELATION_EDGES above.
 */
const INVERSE_ORDERED_RELATION_EDGES: Partial<Record<Query.EdgeType, RelationEnums.Type>> = {
  [Query.EdgeType["I_R:AEE"]]: RelationEnums.Type.ActionEventEquivalent,
};

export class EdgeHasOrderedRelation extends RelationTargetSearchEdge {
  protected relationType: RelationEnums.Type;

  constructor(data: Partial<Query.IEdge>, relationType: RelationEnums.Type) {
    super(data);
    this.relationType = relationType;
  }

  run(q: RStream): RStream {
    return this.runRelationTarget(q, this.relationType);
  }
}

export class EdgeHasInverseOrderedRelation extends RelationTargetSearchEdge {
  protected relationType: RelationEnums.Type;

  constructor(data: Partial<Query.IEdge>, relationType: RelationEnums.Type) {
    super(data);
    this.relationType = relationType;
  }

  run(q: RStream): RStream {
    return this.runRelationTarget(q, this.relationType, true);
  }
}

export class EdgeHasUnorderedRelation extends RelationTargetSearchEdge {
  protected relationType: RelationEnums.Type;

  constructor(data: Partial<Query.IEdge>, relationType: RelationEnums.Type) {
    super(data);
    this.relationType = relationType;
  }

  run(q: RStream): RStream {
    return runHasUnorderedRelationEdge(
      q,
      this.relationType,
      this.targetIds(),
      this.node.params.entityClasses ?? [],
      this.unpinnedTargetStatuses(),
      RelationTypes.RelationRules[this.relationType]?.selfLoop ?? false
    );
  }
}

export class EdgeHasSubordinate extends RelationTargetSearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_R:SOE"];
  }

  run(q: RStream): RStream {
    return this.runRelationTarget(q, RelationEnums.Type.SuperordinateEntity, true);
  }
}

export class EdgeHasMeronym extends RelationTargetSearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_R:HOL"];
  }

  run(q: RStream): RStream {
    return this.runRelationTarget(q, RelationEnums.Type.Holonym, true);
  }
}

export class EdgeHasClassification extends RelationTargetSearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:CLA"];
  }

  run(q: RStream): RStream {
    return this.runRelationTarget(q, RelationEnums.Type.Classification);
  }
}

export class EdgeHasInstance extends RelationTargetSearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_R:CLA"];
  }

  run(q: RStream): RStream {
    return this.runRelationTarget(q, RelationEnums.Type.Classification, true);
  }
}

export class EdgeHasPropType extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["EP:T"];
  }

  run(q: RStream): RStream {
    const targetIds = this.targetIds();
    return q
      .filter(function (e: RDatum<IEntity>) {
        // some of the e.[props].type.entityId is entity.id
        return e("props")
          .filter(function (prop) {
            if (targetIds) {
              return r.expr(targetIds).contains(prop("type")("entityId"));
            } else {
              return prop("type");
            }
          })
          .count()
          .gt(0);
      })
      .map(function (e) {
        return e("id");
      });
  }
}

export class EdgeHasPropValue extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["HP:V"];
  }

  run(q: RStream): RStream {
    const targetIds = this.targetIds();
    return q
      .filter(function (e: RDatum<IEntity>) {
        // some of the e.[props].value.entityId is entity.id
        return e("props")
          .filter(function (prop) {
            if (targetIds) {
              return r.expr(targetIds).contains(prop("value")("entityId"));
            } else {
              return prop("value");
            }
          })
          .count()
          .gt(0);
      })
      .map(function (e) {
        return e("id");
      });
  }
}

/**
 * Collects entityId of prop[kind] across an in-statement props array, recursing
 * into children to lvl3 - mirrors the StatementDataProps index definition.
 */
function collectStatementPropIds(propsExpr: RDatum, kind: "type" | "value"): RDatum {
  return propsExpr.concatMap(function (ch1: RDatum) {
    return r.expr([ch1(kind)("entityId")]).add(
      ch1("children").concatMap(function (ch2: RDatum) {
        return r.expr([ch2(kind)("entityId")]).add(
          ch2("children").concatMap(function (ch3: RDatum) {
            return [ch3(kind)("entityId")];
          }) as RValue
        );
      }) as RValue
    );
  });
}

/**
 * Shared run for the in-statement prop edges (SP:T / SP:V). Keeps only
 * statements and matches those whose data.actions[].props or
 * data.actants[].props (incl. children) reference the target by `kind`.
 * Maps to the statement's own id, preserving the subset invariant negation needs.
 */
function runStatementPropEdge(
  q: RStream,
  targetIds: string[] | null,
  kind: "type" | "value"
): RStream {
  return q
    .filter(function (e: RDatum<IEntity>) {
      return e("class").eq(EntityEnums.Class.Statement);
    })
    .filter(function (e: RDatum<IEntity>) {
      const ids = collectStatementPropIds(
        e("data")("actions").concatMap(function (a: RDatum) {
          return a("props");
        }),
        kind
      ).add(
        collectStatementPropIds(
          e("data")("actants").concatMap(function (a: RDatum) {
            return a("props");
          }),
          kind
        ) as RValue
      );
      if (targetIds) {
        return (ids as RDatum<string[]>).setIntersection(r.expr(targetIds)).isEmpty().not();
      }
      return ids.count().gt(0);
    })
    .map(function (e) {
      return e("id");
    });
}

export class EdgeStatementHasPropType extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["SP:T"];
  }

  run(q: RStream): RStream {
    return runStatementPropEdge(q, this.targetIds(), "type");
  }
}

export class EdgeStatementHasPropValue extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["SP:V"];
  }

  run(q: RStream): RStream {
    return runStatementPropEdge(q, this.targetIds(), "value");
  }
}

/**
 * Shared run for the forward statement actant-field edges (SC / SI). Mirrors
 * SP:T / SP:V (a Statement in q that has some actant referencing the target),
 * but classifications/identifications are a flat {entityId} array with no
 * children, so there's nothing to recurse the way collectStatementPropIds does.
 */
function runStatementActantFieldEdge(
  q: RStream,
  targetIds: string[] | null,
  field: "classifications" | "identifications"
): RStream {
  return q
    .filter(function (e: RDatum<IEntity>) {
      return e("class").eq(EntityEnums.Class.Statement);
    })
    .filter(function (e: RDatum<IEntity>) {
      const ids = e("data")("actants").concatMap(function (a: RDatum) {
        return a(field).map(function (c: RDatum) {
          return c("entityId");
        });
      });
      if (targetIds) {
        return (ids as RDatum<string[]>).setIntersection(r.expr(targetIds)).isEmpty().not();
      }
      return ids.count().gt(0);
    })
    .map(function (e) {
      return e("id");
    });
}

export class EdgeStatementHasClassification extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["SC"];
  }

  run(q: RStream): RStream {
    return runStatementActantFieldEdge(q, this.targetIds(), "classifications");
  }
}

export class EdgeStatementHasIdentification extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["SI"];
  }

  run(q: RStream): RStream {
    return runStatementActantFieldEdge(q, this.targetIds(), "identifications");
  }
}

/**
 * Inverse of SP:T / SP:V. Where SP:* answer "which statements contain an
 * in-statement prop referencing X" (and emit the statement), the inverse
 * answers "which entities are characterised by an in-statement prop
 * referencing X" and emit the ENTITY (the actant that carries the prop).
 *
 * Each actant's own props are evaluated independently (not flattened across the
 * whole statement, as runStatementPropEdge does), so the actant<->prop linkage
 * is preserved: only actants that themselves carry the matching prop are
 * emitted. Candidate statements come from the StatementDataProps index keyed by
 * the target; that index conflates type & value, so `kind` is re-checked per
 * actant for correctness. The result is intersected back with the incoming
 * stream, keeping the subset invariant that positive matching and negation rely
 * on. With no target the edge falls back to a full statement scan.
 */
/**
 * Candidate statements that reference any of `targetIds` via the given multi
 * index (StatementDataProps / StatementActantsCI). With no target the index
 * cannot be used, so fall back to scanning every statement.
 */
function candidateStatements(targetIds: string[] | null, index: DbEnums.Indexes): RStream {
  if (targetIds) {
    return r.table(Entity.table).getAll(r.args(targetIds), { index }) as unknown as RStream;
  }
  return r.table(Entity.table).filter(function (e: RDatum<IEntity>) {
    return e("class").eq(EntityEnums.Class.Statement);
  }) as unknown as RStream;
}

/**
 * Shared tail for the inverse in-statement edges. Over a candidate-statement
 * stream it keeps statements, selects the actants that individually satisfy
 * `actantMatches` (evaluated per actant, so the actant<->prop linkage is kept),
 * emits those actants' entityIds, and intersects them back with the incoming
 * stream `q`. The intersection enforces the subset invariant: the edge only
 * ever returns ids already present in `q`, which positive matching and negation
 * both rely on.
 */
function emitMatchingActants(
  q: RStream,
  statements: RStream,
  actantMatches: (actant: RDatum) => RValue<boolean>
): RStream {
  return intersectIdsWithStream(
    q,
    statements
      .filter(function (e: RDatum<IEntity>) {
        return e("class").eq(EntityEnums.Class.Statement);
      })
      .concatMap(function (stmt: RDatum) {
        return stmt("data")("actants")
          .filter(function (a: RDatum) {
            return actantMatches(a);
          })
          .map(function (a: RDatum) {
            return a("entityId");
          });
      })
  );
}

function runInverseStatementPropEdge(
  q: RStream,
  targetIds: string[] | null,
  kind: "type" | "value"
): RStream {
  return emitMatchingActants(
    q,
    candidateStatements(targetIds, DbEnums.Indexes.StatementDataProps),
    function (a: RDatum) {
      const ids = collectStatementPropIds(a("props"), kind);
      return targetIds
        ? (ids as RDatum<string[]>).setIntersection(r.expr(targetIds)).isEmpty().not()
        : ids.count().gt(0);
    }
  );
}

/**
 * Inverse statement actant-field edges (I_SC / I_SI): emit the entities
 * characterised by an in-statement classification/identification referencing
 * the target. Mirrors runInverseStatementPropEdge but reads the flat
 * actant.classifications[] / actant.identifications[] array (no children to
 * recurse) and uses the StatementActantsCI index, which covers both fields -
 * `field` re-checks which one per actant.
 */
function runInverseStatementActantFieldEdge(
  q: RStream,
  targetIds: string[] | null,
  field: "classifications" | "identifications"
): RStream {
  return emitMatchingActants(
    q,
    candidateStatements(targetIds, DbEnums.Indexes.StatementActantsCI),
    function (a: RDatum) {
      const ids = a(field).map(function (c: RDatum) {
        return c("entityId");
      });
      return targetIds
        ? (ids as RDatum<string[]>).setIntersection(r.expr(targetIds)).isEmpty().not()
        : ids.count().gt(0);
    }
  );
}

export class EdgeIsStatementPropType extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_SP:T"];
  }

  run(q: RStream): RStream {
    return runInverseStatementPropEdge(q, this.targetIds(), "type");
  }
}

export class EdgeIsStatementPropValue extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_SP:V"];
  }

  run(q: RStream): RStream {
    return runInverseStatementPropEdge(q, this.targetIds(), "value");
  }
}

export class EdgeIsStatementClassification extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_SC"];
  }

  run(q: RStream): RStream {
    return runInverseStatementActantFieldEdge(q, this.targetIds(), "classifications");
  }
}

export class EdgeIsStatementIdentification extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_SI"];
  }

  run(q: RStream): RStream {
    return runInverseStatementActantFieldEdge(q, this.targetIds(), "identifications");
  }
}

/**
 * Shared run for the inverse in-statement actant-role edges
 * (I_IS:S / I_IS:A1 / I_IS:A2 / I_IS:PS). Keeps only statements, and matches
 * those that have an actant in one of `positions` whose referenced entity
 * satisfies the edge target:
 *  - any id of the pinned target-id set (`targetIds`, the pinned entity plus
 *    its toggle-driven expansion), or
 *  - any entity whose class is in `targetClasses` (e.g. Statement -> the actant
 *    is a substatement, i.e. a "statement chain"), or
 *  - with neither, any actant present in those positions.
 * Maps to the statement's own id, preserving the subset invariant that positive
 * matching and negation both rely on. A dangling actant entityId (no such
 * entity) is null-safe and simply fails the class condition.
 */
function runStatementHasActantEdge(
  q: RStream,
  positions: EntityEnums.Position[],
  targetIds: string[] | null,
  targetClasses: EntityEnums.Class[]
): RStream {
  return q
    .filter(function (e: RDatum<IEntity>) {
      return e("class").eq(EntityEnums.Class.Statement);
    })
    .filter(function (e: RDatum<IEntity>) {
      const actantIds = e("data")("actants")
        .filter(function (a: RDatum) {
          return r.expr(positions).contains(a("position"));
        })
        .map(function (a: RDatum) {
          return a("entityId");
        });

      if (targetIds) {
        return (actantIds as RDatum<string[]>).setIntersection(r.expr(targetIds)).isEmpty().not();
      }

      if (targetClasses.length) {
        return actantIds
          .filter(function (id: RDatum) {
            return r
              .table(Entity.table)
              .get(id)
              .default(null)
              .do(function (ent: RDatum) {
                return r.branch(ent, r.expr(targetClasses).contains(ent("class")), false);
              });
          })
          .count()
          .gt(0);
      }

      return actantIds.count().gt(0);
    })
    .map(function (e) {
      return e("id");
    });
}

export class EdgeStatementHasSubject extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_IS:S"];
  }

  run(q: RStream): RStream {
    return runStatementHasActantEdge(
      q,
      [EntityEnums.Position.Subject],
      this.targetIds(),
      this.node.params.entityClasses ?? []
    );
  }
}

export class EdgeStatementHasActant1 extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_IS:A1"];
  }

  run(q: RStream): RStream {
    return runStatementHasActantEdge(
      q,
      [EntityEnums.Position.Actant1],
      this.targetIds(),
      this.node.params.entityClasses ?? []
    );
  }
}

export class EdgeStatementHasActant2 extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_IS:A2"];
  }

  run(q: RStream): RStream {
    return runStatementHasActantEdge(
      q,
      [EntityEnums.Position.Actant2],
      this.targetIds(),
      this.node.params.entityClasses ?? []
    );
  }
}

export class EdgeStatementHasPseudoActant extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_IS:PS"];
  }

  run(q: RStream): RStream {
    return runStatementHasActantEdge(
      q,
      [EntityEnums.Position.PseudoActant],
      this.targetIds(),
      this.node.params.entityClasses ?? []
    );
  }
}

/**
 * I_IS:A ("S has: action"). Emits STATEMENTS whose data.actions[].actionId
 * references the edge target - an id of the pinned target-id set, or (with no
 * pinned target) any action whose entity class is in `targetClasses`, or with
 * neither, any statement that has an action at all. Maps to the statement's
 * own id, preserving the subset invariant positive matching and negation rely
 * on. Mirrors runStatementHasActantEdge but over data.actions, which carries
 * no `position` field.
 */
function runStatementHasActionEdge(
  q: RStream,
  targetIds: string[] | null,
  targetClasses: EntityEnums.Class[]
): RStream {
  return q
    .filter(function (e: RDatum<IEntity>) {
      return e("class").eq(EntityEnums.Class.Statement);
    })
    .filter(function (e: RDatum<IEntity>) {
      const actionIds = e("data")("actions").map(function (a: RDatum) {
        return a("actionId");
      });

      if (targetIds) {
        return (actionIds as RDatum<string[]>).setIntersection(r.expr(targetIds)).isEmpty().not();
      }

      if (targetClasses.length) {
        return actionIds
          .filter(function (id: RDatum) {
            return r
              .table(Entity.table)
              .get(id)
              .default(null)
              .do(function (ent: RDatum) {
                return r.branch(ent, r.expr(targetClasses).contains(ent("class")), false);
              });
          })
          .count()
          .gt(0);
      }

      return actionIds.count().gt(0);
    })
    .map(function (e) {
      return e("id");
    });
}

export class EdgeStatementHasAction extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_IS:A"];
  }

  run(q: RStream): RStream {
    return runStatementHasActionEdge(q, this.targetIds(), this.node.params.entityClasses ?? []);
  }
}

/**
 * I_IS: ("S has: in any position"). Emits STATEMENTS that reference the target
 * entity anywhere - as an action, an actant, a tag, or the direct territory (the
 * StatementEntities index), or as an in-statement prop type/value recursing to
 * lvl3 (the StatementDataProps index). Maps to the statement's own id, keeping
 * the subset invariant that positive matching and negation rely on.
 *
 * Unlike its position-specific siblings (I_IS:S / I_IS:A1 / I_IS:A2), which read
 * a single actant position by scanning q, this is index-backed: the union of the
 * two entity-keyed statement indexes is intersected back into q. Co-occurrence of
 * several entities is expressed by AND-combining one I_IS: edge per entity under
 * a single Statement source node - each edge narrows the set to statements that
 * also reference that entity.
 *
 * Coverage matches getCoOccurrentEntityIds: actions, actants, tags, direct
 * territory and in-statement prop type/value. Reference resource/value and
 * actant classifications/identifications have no shared "used anywhere" index
 * and are intentionally out of scope. With no target the edge matches nothing
 * (membership "in a statement" is only meaningful relative to a specific
 * entity).
 */
function runStatementHasEntityEdge(q: RStream, targetIds: string[] | null): RStream {
  return intersectIdsWithStream(
    q,
    targetIds
      ? r
          .table(Entity.table)
          .getAll(r.args(targetIds), {
            index: DbEnums.Indexes.StatementEntities,
          })
          .union(
            r.table(Entity.table).getAll(r.args(targetIds), {
              index: DbEnums.Indexes.StatementDataProps,
            }) as unknown as RStream
          )
          .filter(function (e: RDatum<IEntity>) {
            return e("class").eq(EntityEnums.Class.Statement);
          })
          .map(function (e: RDatum<IEntity>) {
            return e("id");
          })
      : null
  );
}

export class EdgeStatementHasEntity extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_IS:"];
  }

  run(q: RStream): RStream {
    return runStatementHasEntityEdge(q, this.targetIds());
  }
}

/** type+value entityIds across a props array, recursing children to lvl3. */
function collectPropEntityIds(propsExpr: RDatum): RDatum {
  return collectStatementPropIds(propsExpr, "type").add(
    collectStatementPropIds(propsExpr, "value") as RValue
  );
}

/**
 * Broad set of entity ids USED in a single statement - mirrors
 * Statement.getEntitiesIds(): statement-level prop type/value ids and reference
 * resource/value ids, action ids + action prop ids, actant entityIds +
 * classifications + identifications + actant prop ids, and tags. The statement's
 * own territory lineage and id are intentionally excluded (they are not
 * "entities used"). Prop ids recurse children to lvl3 (see collectPropEntityIds).
 */
function collectStatementEntityIds(stmt: RDatum): RDatum {
  return (collectPropEntityIds(stmt("props")) as RDatum)
    .add(
      // a few legacy entities store references as "" instead of an array
      r.branch(
        stmt("references").typeOf().eq("ARRAY"),
        stmt("references").concatMap(function (ref: RDatum) {
          return [ref("resource"), ref("value")];
        }),
        r.expr([] as string[])
      ) as RValue
    )
    .add(
      // data.actions may be absent on a legacy/partial statement doc; an
      // unguarded access would abort the whole ReQL expression (see inner
      // classifications/identifications guards below)
      r.branch(
        stmt("data").hasFields("actions"),
        stmt("data")("actions").concatMap(function (a: RDatum) {
          return (r.expr([a("actionId")]) as RDatum).add(
            collectPropEntityIds(a("props")) as RValue
          );
        }),
        r.expr([] as string[])
      ) as RValue
    )
    .add(
      // data.actants may likewise be absent - guard before access
      r.branch(
        stmt("data").hasFields("actants"),
        stmt("data")("actants").concatMap(function (a: RDatum) {
          // classifications / identifications are optional on an actant row
          // (getEntitiesIds uses ?.; the StatementActantsCI index guards the same
          // two fields with hasFields) - an unguarded access would abort the query
          return (r.expr([a("entityId")]) as RDatum)
            .add(
              r.branch(
                a.hasFields("classifications"),
                a("classifications").map(function (c: RDatum) {
                  return c("entityId");
                }),
                r.expr([] as string[])
              ) as RValue
            )
            .add(
              r.branch(
                a.hasFields("identifications"),
                a("identifications").map(function (ci: RDatum) {
                  return ci("entityId");
                }),
                r.expr([] as string[])
              ) as RValue
            )
            .add(collectPropEntityIds(a("props")) as RValue);
        }),
        r.expr([] as string[])
      ) as RValue
    )
    .add(
      // data.tags may be absent - guard before access
      r.branch(
        stmt("data").hasFields("tags"),
        stmt("data")("tags"),
        r.expr([] as string[])
      ) as RValue
    );
}

/**
 * EUT: ("used in statements under T"). Emits the ENTITIES USED in statements
 * directly under territory T - mirroring the I_SP / I_SC / I_IS convention of
 * surfacing the entity referenced inside a statement rather than the statement
 * itself. (Distinct from I_SUT: "T has S", which is the Territory<->Statement
 * inverse and emits statements.)
 *
 * Candidate statements come from the StatementTerritory index (DIRECT territory
 * only, no descendant closure). Their broad "used" id set (collectStatementEntityIds)
 * is intersected back with the incoming stream q, keeping the subset invariant
 * that positive matching and negation rely on. With no target territory the edge
 * matches nothing (an entity is "used under T" only relative to a specific T).
 */
function runUsedUnderTerritoryEdge(q: RStream, territoryIds: string[] | null): RStream {
  return intersectIdsWithStream(
    q,
    territoryIds
      ? r
          .table(Entity.table)
          .getAll(r.args(territoryIds), {
            index: DbEnums.Indexes.StatementTerritory,
          })
          .filter(function (e: RDatum<IEntity>) {
            return e("class").eq(EntityEnums.Class.Statement);
          })
          .concatMap(function (stmt: RDatum) {
            return collectStatementEntityIds(stmt);
          })
      : null
  );
}

export class EdgeUsedUnderTerritory extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["EUT:"];
  }

  run(q: RStream): RStream {
    return runUsedUnderTerritoryEdge(q, this.targetIds());
  }
}

/**
 * IS: ("is in S: any position", aka XIsInS). Emits the ENTITIES USED in the
 * target Statement S in ANY position - actions + action props, actants +
 * their classifications / identifications / props, statement-level props
 * (recursing children to lvl3), reference resource / value, and tags. This is
 * exactly the broad "used" set collectStatementEntityIds surfaces (the same set
 * EUT: surfaces per territory), so the two share that collector.
 *
 * The single target statement is fetched by primary key (no index needed); a
 * non-statement or unknown id yields no statement and therefore no matches. The
 * used-id set is intersected back with the incoming stream q, keeping the subset
 * invariant that positive matching and negation both rely on. With no target the
 * edge matches nothing (membership "in S" is only meaningful relative to a
 * specific statement). The statement's own id and its territory lineage are not
 * "entities used" and are intentionally excluded (see collectStatementEntityIds).
 */
function runIsInStatementEdge(q: RStream, statementIds: string[] | null): RStream {
  return intersectIdsWithStream(
    q,
    statementIds
      ? r
          .table(Entity.table)
          .getAll(r.args(statementIds))
          .filter(function (e: RDatum<IEntity>) {
            return e("class").eq(EntityEnums.Class.Statement);
          })
          .concatMap(function (stmt: RDatum) {
            return collectStatementEntityIds(stmt);
          })
      : null
  );
}

export class EdgeIsInStatement extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["IS:"];
  }

  run(q: RStream): RStream {
    return runIsInStatementEdge(q, this.targetIds());
  }
}

/**
 * Shared run for the position-restricted "is in S" edges (IS:S / IS:A1 /
 * IS:A2 / IS:PS). Emits the ENTITY occupying one of `positions` in the target
 * Statement(s) - the inverse of I_IS:S / I_IS:A1 / I_IS:A2 (runStatementHasActantEdge),
 * which instead emit the statement given the actant. The target statement is
 * fetched by primary key (no index needed); a non-statement or unknown id
 * yields no statement and therefore no matches. Intersected back with the
 * incoming stream q, keeping the subset invariant that positive matching and
 * negation both rely on. With no target the edge matches nothing (an actant
 * "in S" is only meaningful relative to a specific statement).
 */
function runIsInStatementActantEdge(
  q: RStream,
  statementIds: string[] | null,
  positions: EntityEnums.Position[]
): RStream {
  return intersectIdsWithStream(
    q,
    statementIds
      ? r
          .table(Entity.table)
          .getAll(r.args(statementIds))
          .filter(function (e: RDatum<IEntity>) {
            return e("class").eq(EntityEnums.Class.Statement);
          })
          .concatMap(function (stmt: RDatum) {
            return stmt("data")("actants")
              .filter(function (a: RDatum) {
                return r.expr(positions).contains(a("position"));
              })
              .map(function (a: RDatum) {
                return a("entityId");
              });
          })
      : null
  );
}

export class EdgeIsInStatementAsSubject extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["IS:S"];
  }

  run(q: RStream): RStream {
    return runIsInStatementActantEdge(q, this.targetIds(), [EntityEnums.Position.Subject]);
  }
}

export class EdgeIsInStatementAsActant1 extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["IS:A1"];
  }

  run(q: RStream): RStream {
    return runIsInStatementActantEdge(q, this.targetIds(), [EntityEnums.Position.Actant1]);
  }
}

export class EdgeIsInStatementAsActant2 extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["IS:A2"];
  }

  run(q: RStream): RStream {
    return runIsInStatementActantEdge(q, this.targetIds(), [EntityEnums.Position.Actant2]);
  }
}

export class EdgeIsInStatementAsPseudoActant extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["IS:PS"];
  }

  run(q: RStream): RStream {
    return runIsInStatementActantEdge(q, this.targetIds(), [EntityEnums.Position.PseudoActant]);
  }
}

/**
 * IS:A ("is in S: as action"). Emits the ACTION entity of the target
 * Statement(s) - data.actions[].actionId, which has no `position` (actions
 * sit outside the actant/position model runIsInStatementActantEdge covers).
 * The target statement is fetched by primary key; a non-statement or unknown
 * id yields no statement and therefore no matches. Intersected back with the
 * incoming stream q, keeping the subset invariant that positive matching and
 * negation both rely on.
 */
function runIsInStatementActionEdge(q: RStream, statementIds: string[] | null): RStream {
  return intersectIdsWithStream(
    q,
    statementIds
      ? r
          .table(Entity.table)
          .getAll(r.args(statementIds))
          .filter(function (e: RDatum<IEntity>) {
            return e("class").eq(EntityEnums.Class.Statement);
          })
          .concatMap(function (stmt: RDatum) {
            return stmt("data")("actions").map(function (a: RDatum) {
              return a("actionId");
            });
          })
      : null
  );
}

export class EdgeIsInStatementAsAction extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["IS:A"];
  }

  run(q: RStream): RStream {
    return runIsInStatementActionEdge(q, this.targetIds());
  }
}

export class EdgeHasReferenceResource extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["HR:R"];
  }

  run(q: RStream): RStream {
    const targetIds = this.targetIds();
    return q
      .filter(function (e: RDatum<IEntity>) {
        // a few legacy entities (e.g. the root territory) store references as
        // "" instead of an array - treat any non-array as "no references"
        return r
          .branch(e("references").typeOf().eq("ARRAY"), e("references"), r.expr([] as any[]))
          .filter(function (ref: RDatum) {
            if (targetIds) {
              return r.expr(targetIds).contains(ref("resource"));
            }
            // a reference's "resource" can be empty (e.g. value-only refs) -
            // "any resource" must mean a non-empty resource, not just any reference
            return ref("resource").default("").ne("");
          })
          .count()
          .gt(0);
      })
      .map(function (e) {
        return e("id");
      });
  }
}

/**
 * I_HR:R ("R references"). Inverse of HR:R: where that matches the entity
 * holding a reference to a pinned Resource, this matches the Resources that a
 * pinned entity's own references[] point at. Intersected back with q, keeping
 * the subset invariant positive matching and negation both rely on. A few
 * legacy entities store references as "" rather than an array, and a
 * reference's "resource" can be empty on a value-only ref - both are skipped.
 */
function runIsReferenceResourceEdge(q: RStream, entityIds: string[] | null): RStream {
  return intersectIdsWithStream(
    q,
    entityIds
      ? (r
          .table(Entity.table)
          .getAll(r.args(entityIds))
          .concatMap(function (e: RDatum<IEntity>) {
            return r.branch(
              e("references").typeOf().eq("ARRAY"),
              e("references").map(function (ref: RDatum) {
                return ref("resource").default("");
              }),
              r.expr([] as string[])
            );
          })
          .filter(function (id: RDatum<string>) {
            return id.ne("");
          }) as unknown as RStream)
      : null
  );
}

export class EdgeIsReferenceResource extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_HR:R"];
  }

  run(q: RStream): RStream {
    return runIsReferenceResourceEdge(q, this.targetIds());
  }
}

export class EdgeHasReferenceValue extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["HR:V"];
  }

  run(q: RStream): RStream {
    const targetIds = this.targetIds();
    return q
      .filter(function (e: RDatum<IEntity>) {
        // a few legacy entities (e.g. the root territory) store references as
        // "" instead of an array - treat any non-array as "no references"
        return r
          .branch(e("references").typeOf().eq("ARRAY"), e("references"), r.expr([] as any[]))
          .filter(function (ref: RDatum) {
            if (targetIds) {
              return r.expr(targetIds).contains(ref("value"));
            }
            // unlike "resource", a reference's "value" is often empty -
            // "any value" must mean a non-empty value, not just any reference
            return ref("value").default("").ne("");
          })
          .count()
          .gt(0);
      })
      .map(function (e) {
        return e("id");
      });
  }
}

export function getEdgeInstance(data: Partial<Query.IEdge>): SearchEdge {
  switch (data.type) {
    case Query.EdgeType["EP:T"]:
      return new EdgeHasPropType(data);
    case Query.EdgeType["HP:V"]:
      return new EdgeHasPropValue(data);
    case Query.EdgeType["HR:R"]:
      return new EdgeHasReferenceResource(data);
    case Query.EdgeType["I_HR:R"]:
      return new EdgeIsReferenceResource(data);
    case Query.EdgeType["HR:V"]:
      return new EdgeHasReferenceValue(data);
    case Query.EdgeType["SP:T"]:
      return new EdgeStatementHasPropType(data);
    case Query.EdgeType["SP:V"]:
      return new EdgeStatementHasPropValue(data);
    case Query.EdgeType["SC"]:
      return new EdgeStatementHasClassification(data);
    case Query.EdgeType["SI"]:
      return new EdgeStatementHasIdentification(data);
    case Query.EdgeType["I_SP:T"]:
      return new EdgeIsStatementPropType(data);
    case Query.EdgeType["I_SP:V"]:
      return new EdgeIsStatementPropValue(data);
    case Query.EdgeType["I_SC"]:
      return new EdgeIsStatementClassification(data);
    case Query.EdgeType["I_SI"]:
      return new EdgeIsStatementIdentification(data);
    case Query.EdgeType["I_IS:"]:
      return new EdgeStatementHasEntity(data);
    case Query.EdgeType["I_IS:S"]:
      return new EdgeStatementHasSubject(data);
    case Query.EdgeType["I_IS:A1"]:
      return new EdgeStatementHasActant1(data);
    case Query.EdgeType["I_IS:A2"]:
      return new EdgeStatementHasActant2(data);
    case Query.EdgeType["I_IS:PS"]:
      return new EdgeStatementHasPseudoActant(data);
    case Query.EdgeType["I_IS:A"]:
      return new EdgeStatementHasAction(data);
    case Query.EdgeType["R:"]:
      return new EdgeHasRelation(data);
    case Query.EdgeType["R:CLA"]:
      return new EdgeHasClassification(data);
    case Query.EdgeType["I_R:CLA"]:
      return new EdgeHasInstance(data);
    case Query.EdgeType["I_R:HOL"]:
      return new EdgeHasMeronym(data);
    case Query.EdgeType["R:SCL"]:
      return new EdgeCHasSuperclass(data);
    case Query.EdgeType["I_R:SCL"]:
      return new EdgeHasSubclass(data);
    case Query.EdgeType["R:SOE"]:
      return new EdgeHasSuperordinate(data);
    case Query.EdgeType["I_R:SOE"]:
      return new EdgeHasSubordinate(data);
    case Query.EdgeType["SUT:"]:
      return new EdgeSUnderT(data);
    case Query.EdgeType["I_SUT:"]:
      return new EdgeTerritoryHasStatement(data);
    case Query.EdgeType["CT:"]:
      return new EdgeTerritoryHasChild(data);
    case Query.EdgeType["CT:D"]:
      return new EdgeTerritoryHasDirectChild(data);
    case Query.EdgeType["I_CT:"]:
      return new EdgeTerritoryHasParent(data);
    case Query.EdgeType["EUT:"]:
      return new EdgeUsedUnderTerritory(data);
    case Query.EdgeType["IS:"]:
      return new EdgeIsInStatement(data);
    case Query.EdgeType["IS:S"]:
      return new EdgeIsInStatementAsSubject(data);
    case Query.EdgeType["IS:A1"]:
      return new EdgeIsInStatementAsActant1(data);
    case Query.EdgeType["IS:A2"]:
      return new EdgeIsInStatementAsActant2(data);
    case Query.EdgeType["IS:PS"]:
      return new EdgeIsInStatementAsPseudoActant(data);
    case Query.EdgeType["IS:A"]:
      return new EdgeIsInStatementAsAction(data);
    default: {
      const orderedRelation = data.type ? ORDERED_RELATION_EDGES[data.type] : undefined;
      if (orderedRelation) {
        return new EdgeHasOrderedRelation(data, orderedRelation);
      }
      const unorderedRelation = data.type ? UNORDERED_RELATION_EDGES[data.type] : undefined;
      if (unorderedRelation) {
        return new EdgeHasUnorderedRelation(data, unorderedRelation);
      }
      const inverseOrderedRelation = data.type
        ? INVERSE_ORDERED_RELATION_EDGES[data.type]
        : undefined;
      if (inverseOrderedRelation) {
        return new EdgeHasInverseOrderedRelation(data, inverseOrderedRelation);
      }
      throw new InternalServerError(`unknown edge type: ${data.type}`);
    }
  }
}
