import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import {
  getEquivalentEntityIds,
  getSubordinateEntityIds,
} from "@models/relation/functions";
import Territory from "@models/territory/territory";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation as RelationTypes } from "@inkvisitor/shared/types";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import { Query } from "@inkvisitor/shared/types/query";
import { Connection, r, RDatum, RStream, RValue } from "rethinkdb-ts";
import { SearchNode } from ".";

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
   * Expanded target-id set for a pinned target node, resolved in prepare():
   * the pinned entityId plus its equivalents (SYN/AEE/IDE) and/or subordinates
   * (inverse SCL/SOE/HOL + child territories, all levels) when the node's
   * expansion toggles ask for them. Null when the target node is not pinned -
   * toggles never affect an unpinned target.
   */
  protected targetEntityIds: string[] | null = null;

  /**
   * Async precomputation hook, invoked by the node evaluator before run().
   * run() only composes synchronous ReQL, so anything fetched ahead of time
   * (the expanded target-id set here, a territory-subtree closure in SUT:C)
   * is resolved here. Subclasses overriding prepare() must call
   * super.prepare() so the target expansion stays resolved.
   */
  async prepare(db: Connection): Promise<void> {
    const entityId = this.node.params.entityId;
    if (!entityId) {
      this.targetEntityIds = null;
      return;
    }

    // both toggles off -> single-id set, no expansion queries issued
    const ids = new Set<string>([entityId]);
    if (this.node.params.includeEquivalents) {
      for (const id of await getEquivalentEntityIds(db, [entityId])) {
        ids.add(id);
      }
    }
    if (this.node.params.includeSubordinates) {
      for (const id of await getSubordinateEntityIds(db, [entityId])) {
        ids.add(id);
      }
    }
    this.targetEntityIds = [...ids];
  }

  /**
   * Target-id set for run() call sites to match against. Non-empty when the
   * target node is pinned (it always contains the pinned id itself), null
   * otherwise. Falls back to the raw params.entityId when prepare() has not
   * run, so a bare run() keeps the single-id semantics.
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

export class EdgeHasClassification extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:CLA"];
  }

  run(q: RStream): RStream {
    const targetIds = this.targetIds();
    return q.concatMap(function(entity: RDatum<IEntity>) {
      return r
        .table(Relation.table)
        .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
        .filter({
          type: RelationEnums.Type.Classification,
        })
        .filter(function(relation: RDatum<RelationTypes.IRelation>) {
          return relation("entityIds").nth(0).eq(entity("id"));
        })
        .filter(function(relation: RDatum<RelationTypes.IRelation>) {
          if (targetIds) {
            return relation("entityIds")
              .setIntersection(r.expr(targetIds))
              .isEmpty()
              .not();
          }
          return true;
        })
        .map(function(relation) {
          return relation("entityIds").nth(0);
        });
    });
  }
}

export class EdgeSUnderT extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["SUT:"];
  }

  run(q: RStream): RStream {
    const territoryId = this.node.params.entityId;
    const targetIds = this.targetIds();
    return q
      .filter(function(e: RDatum<IEntity>) {
        return e("class").eq("S");
      })
      .filter(function(e: RDatum<IEntity>) {
        // unpinned target keeps the raw single-id comparison (matches nothing)
        return targetIds
          ? r.expr(targetIds).contains(e("data")("territory")("territoryId"))
          : e("data")("territory")("territoryId").eq(territoryId);
      })
      .map(function(e) {
        return e("id");
      });
  }
}

/**
 * SUT:C ("S under T: children"). Emits every Statement whose territory is the
 * target territory T OR any descendant of T, recursively to any depth (the whole
 * subtree rooted at T, T itself included).
 *
 * Territories store only their DIRECT parent (data.parent.territoryId) with no
 * ancestor path, so the descendant closure can't be a single index lookup. It's
 * resolved in prepare() via Territory.findChilds(deep), which walks the in-memory
 * treeCache (zero DB reads in prod) and falls back to a live DB walk when the
 * cache is cold or the territory is absent. run() then pulls the subtree's
 * statements through the StatementTerritory index and intersects them with the
 * incoming stream (the subset invariant that positive matching and negation rely
 * on). No target territory -> matches nothing.
 */
export class EdgeSUnderChildrenT extends SearchEdge {
  private subtreeTerritoryIds: string[] = [];

  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["SUT:C"];
  }

  async prepare(db: Connection): Promise<void> {
    // resolve the expanded target-id set first; the subtree closure is then
    // built over EVERY expanded root (a single root when toggles are off)
    await super.prepare(db);
    const rootIds = this.targetEntityIds ?? [];
    if (!rootIds.length) {
      this.subtreeTerritoryIds = [];
      return;
    }

    // findChilds(deep) returns descendants only (keyed by id) - add each root
    // itself to cover Statements sitting directly in the target territory;
    // non-territory roots (equivalents can be any class) simply yield no childs
    const subtree = new Set<string>(rootIds);
    for (const rootId of rootIds) {
      const descendants = await new Territory({ id: rootId }).findChilds(
        db,
        true
      );
      for (const id of Object.keys(descendants)) {
        subtree.add(id);
      }
    }
    this.subtreeTerritoryIds = [...subtree];
  }

  run(q: RStream): RStream {
    const subtreeIds = this.subtreeTerritoryIds;

    return intersectIdsWithStream(
      q,
      subtreeIds.length
        ? (r
            .table(Entity.table)
            .getAll(r.args(subtreeIds), {
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

export class EdgeHasRelation extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:"];
  }

  run(q: RStream): RStream {
    const targetIds = this.targetIds();

    return q.concatMap(function(entity: RDatum<IEntity>) {
      return (
        r
          .table(Relation.table)
          .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
          // get all relations where any entity is the source entity
          .filter(function(relation: RDatum<RelationTypes.IRelation>) {
            return relation("entityIds").contains(entity("id"));
          })
          // check if any of the target entities is also in the relation
          .filter(function(relation: RDatum<RelationTypes.IRelation>) {
            if (targetIds) {
              return relation("entityIds")
                .setIntersection(r.expr(targetIds))
                .isEmpty()
                .not();
            }
            return true;
          })
          // emit the iterated entity itself (it participates in a qualifying
          // relation) instead of the relation's first member - this keeps the
          // result a subset of the input stream, which positive matching and
          // negation (base set minus matches) both rely on
          .map(function() {
            return entity("id");
          })
      );
    });
  }
}

/**
 * Shared run for the forward relation edges that walk from the iterated entity
 * (entityIds[0]) to its relation target (entityIds[1]): R:SCL (Superclass) and
 * R:SOE (SuperordinateEntity). Matches relations of `relationType` where the
 * target satisfies the edge target:
 *  - any id of the pinned target-id set (`targetIds`, the pinned entity plus
 *    its toggle-driven expansion), or
 *  - any entity whose class is in `targetClasses` (empty suggester + class
 *    selected there), or
 *  - with neither, any relation of the type.
 * Emits the iterated entity itself (the entityIds[0] side), keeping the subset
 * invariant positive matching and negation rely on. A dangling target entity id
 * (no such entity) is null-safe and simply fails the class condition.
 */
function runHasRelationTargetEdge(
  q: RStream,
  relationType: RelationEnums.Type,
  targetIds: string[] | null,
  targetClasses: EntityEnums.Class[]
): RStream {
  return q.concatMap(function(entity: RDatum<IEntity>) {
    return (
      r
        .table(Relation.table)
        .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
        .filter({
          type: relationType,
        })
        // get all relations where the first entity is the source entity
        // (for R:SOE this is the subordinate side; its superordinate is
        // entityIds[1], mirroring SuperordinateEntity.getSuperordinate...
        // ForwardConnections, which recurses on entityIds[1])
        .filter(function(relation: RDatum<RelationTypes.IRelation>) {
          return relation("entityIds").nth(0).eq(entity("id"));
        })
        // check if the target entity is one of the desired ones
        .filter(function(relation: RDatum<RelationTypes.IRelation>) {
          if (targetIds) {
            return r.expr(targetIds).contains(relation("entityIds").nth(1));
          }
          if (targetClasses.length) {
            return r
              .table(Entity.table)
              .get(relation("entityIds").nth(1))
              .default(null)
              .do(function (ent: RDatum) {
                return r.branch(
                  ent,
                  r.expr(targetClasses).contains(ent("class")),
                  false
                );
              });
          }
          return true;
        })
        .map(function(relation) {
          return relation("entityIds").nth(0);
        })
    );
  });
}

export class EdgeCHasSuperclass extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:SCL"];
  }

  run(q: RStream): RStream {
    return runHasRelationTargetEdge(
      q,
      RelationEnums.Type.Superclass,
      this.targetIds(),
      this.node.params.entityClasses ?? []
    );
  }
}

export class EdgeHasSuperordinate extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:SOE"];
  }

  run(q: RStream): RStream {
    return runHasRelationTargetEdge(
      q,
      RelationEnums.Type.SuperordinateEntity,
      this.targetIds(),
      this.node.params.entityClasses ?? []
    );
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
      .filter(function(e: RDatum<IEntity>) {
        // some of the e.[props].type.entityId is entity.id
        return e("props")
          .filter(function(prop) {
            if (targetIds) {
              return r.expr(targetIds).contains(prop("type")("entityId"));
            } else {
              return prop("type");
            }
          })
          .count()
          .gt(0);
      })
      .map(function(e) {
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
      .filter(function(e: RDatum<IEntity>) {
        // some of the e.[props].value.entityId is entity.id
        return e("props")
          .filter(function(prop) {
            if (targetIds) {
              return r.expr(targetIds).contains(prop("value")("entityId"));
            } else {
              return prop("value");
            }
          })
          .count()
          .gt(0);
      })
      .map(function(e) {
        return e("id");
      });
  }
}

/**
 * Collects entityId of prop[kind] across an in-statement props array, recursing
 * into children to lvl3 - mirrors the StatementDataProps index definition.
 */
function collectStatementPropIds(
  propsExpr: RDatum,
  kind: "type" | "value"
): RDatum {
  return propsExpr.concatMap(function(ch1: RDatum) {
    return r.expr([ch1(kind)("entityId")]).add(
      ch1("children").concatMap(function(ch2: RDatum) {
        return r.expr([ch2(kind)("entityId")]).add(
          ch2("children").concatMap(function(ch3: RDatum) {
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
    .filter(function(e: RDatum<IEntity>) {
      return e("class").eq(EntityEnums.Class.Statement);
    })
    .filter(function(e: RDatum<IEntity>) {
      const ids = collectStatementPropIds(
        e("data")("actions").concatMap(function(a: RDatum) {
          return a("props");
        }),
        kind
      ).add(
        collectStatementPropIds(
          e("data")("actants").concatMap(function(a: RDatum) {
            return a("props");
          }),
          kind
        ) as RValue
      );
      if (targetIds) {
        return (ids as RDatum<string[]>)
          .setIntersection(r.expr(targetIds))
          .isEmpty()
          .not();
      }
      return ids.count().gt(0);
    })
    .map(function(e) {
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
function candidateStatements(
  targetIds: string[] | null,
  index: DbEnums.Indexes
): RStream {
  if (targetIds) {
    return r
      .table(Entity.table)
      .getAll(r.args(targetIds), { index }) as unknown as RStream;
  }
  return r.table(Entity.table).filter(function(e: RDatum<IEntity>) {
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
      .filter(function(e: RDatum<IEntity>) {
        return e("class").eq(EntityEnums.Class.Statement);
      })
      .concatMap(function(stmt: RDatum) {
        return stmt("data")("actants")
          .filter(function(a: RDatum) {
            return actantMatches(a);
          })
          .map(function(a: RDatum) {
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
    function(a: RDatum) {
      const ids = collectStatementPropIds(a("props"), kind);
      return targetIds
        ? (ids as RDatum<string[]>)
            .setIntersection(r.expr(targetIds))
            .isEmpty()
            .not()
        : ids.count().gt(0);
    }
  );
}

/**
 * Inverse statement-classification edge (I_SC): emit the entities characterised
 * by an in-statement classification referencing the target concept. Mirrors
 * runInverseStatementPropEdge but reads actant.classifications[] and uses the
 * StatementActantsCI index (which also covers identifications - those are not
 * matched here).
 */
function runInverseStatementClassificationEdge(
  q: RStream,
  targetIds: string[] | null
): RStream {
  return emitMatchingActants(
    q,
    candidateStatements(targetIds, DbEnums.Indexes.StatementActantsCI),
    function(a: RDatum) {
      const ids = a("classifications").map(function(c: RDatum) {
        return c("entityId");
      });
      return targetIds
        ? (ids as RDatum<string[]>)
            .setIntersection(r.expr(targetIds))
            .isEmpty()
            .not()
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
    return runInverseStatementClassificationEdge(q, this.targetIds());
  }
}

/**
 * Shared run for the inverse in-statement actant-role edges
 * (I_IS:S / I_IS:A1 / I_IS:A2). Keeps only statements, and matches those that
 * have an actant in one of `positions` whose referenced entity satisfies the
 * edge target:
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
        return (actantIds as RDatum<string[]>)
          .setIntersection(r.expr(targetIds))
          .isEmpty()
          .not();
      }

      if (targetClasses.length) {
        return actantIds
          .filter(function (id: RDatum) {
            return r
              .table(Entity.table)
              .get(id)
              .default(null)
              .do(function (ent: RDatum) {
                return r.branch(
                  ent,
                  r.expr(targetClasses).contains(ent("class")),
                  false
                );
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
 * Coverage matches the established getCoOccurrentEntityIds semantics (actions,
 * actants, tags, direct territory) plus in-statement prop type/value. Reference
 * resource/value and actant classifications/identifications have no shared "used
 * anywhere" index and are intentionally out of scope. With no target the edge
 * matches nothing (membership "in a statement" is only meaningful relative to a
 * specific entity).
 */
function runStatementHasEntityEdge(
  q: RStream,
  targetIds: string[] | null
): RStream {
  return intersectIdsWithStream(
    q,
    targetIds
      ? r
          .table(Entity.table)
          .getAll(r.args(targetIds), {
            index: DbEnums.Indexes.StatementEntities,
          })
          .union(
            r
              .table(Entity.table)
              .getAll(r.args(targetIds), {
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
function runUsedUnderTerritoryEdge(
  q: RStream,
  territoryIds: string[] | null
): RStream {
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
function runIsInStatementEdge(
  q: RStream,
  statementIds: string[] | null
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

export class EdgeHasReferenceResource extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["HR:R"];
  }

  run(q: RStream): RStream {
    const targetIds = this.targetIds();
    return q
      .filter(function(e: RDatum<IEntity>) {
        // a few legacy entities (e.g. the root territory) store references as
        // "" instead of an array - treat any non-array as "no references"
        return r
          .branch(
            e("references").typeOf().eq("ARRAY"),
            e("references"),
            r.expr([] as any[])
          )
          .filter(function(ref: RDatum) {
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
      .map(function(e) {
        return e("id");
      });
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
      .filter(function(e: RDatum<IEntity>) {
        // a few legacy entities (e.g. the root territory) store references as
        // "" instead of an array - treat any non-array as "no references"
        return r
          .branch(
            e("references").typeOf().eq("ARRAY"),
            e("references"),
            r.expr([] as any[])
          )
          .filter(function(ref: RDatum) {
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
      .map(function(e) {
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
    case Query.EdgeType["HR:V"]:
      return new EdgeHasReferenceValue(data);
    case Query.EdgeType["SP:T"]:
      return new EdgeStatementHasPropType(data);
    case Query.EdgeType["SP:V"]:
      return new EdgeStatementHasPropValue(data);
    case Query.EdgeType["I_SP:T"]:
      return new EdgeIsStatementPropType(data);
    case Query.EdgeType["I_SP:V"]:
      return new EdgeIsStatementPropValue(data);
    case Query.EdgeType["I_SC"]:
      return new EdgeIsStatementClassification(data);
    case Query.EdgeType["I_IS:"]:
      return new EdgeStatementHasEntity(data);
    case Query.EdgeType["I_IS:S"]:
      return new EdgeStatementHasSubject(data);
    case Query.EdgeType["I_IS:A1"]:
      return new EdgeStatementHasActant1(data);
    case Query.EdgeType["I_IS:A2"]:
      return new EdgeStatementHasActant2(data);
    case Query.EdgeType["R:"]:
      return new EdgeHasRelation(data);
    case Query.EdgeType["R:CLA"]:
      return new EdgeHasClassification(data);
    case Query.EdgeType["R:SCL"]:
      return new EdgeCHasSuperclass(data);
    case Query.EdgeType["R:SOE"]:
      return new EdgeHasSuperordinate(data);
    case Query.EdgeType["SUT:"]:
      return new EdgeSUnderT(data);
    case Query.EdgeType["SUT:C"]:
      return new EdgeSUnderChildrenT(data);
    case Query.EdgeType["EUT:"]:
      return new EdgeUsedUnderTerritory(data);
    case Query.EdgeType["IS:"]:
      return new EdgeIsInStatement(data);
    default:
      throw new InternalServerError(`unknown edge type: ${data.type}`);
  }
}
