import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import { DbEnums, EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation as RelationTypes } from "@inkvisitor/shared/types";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import { Query } from "@inkvisitor/shared/types/query";
import { r, RDatum, RStream, RValue } from "rethinkdb-ts";
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

  run(q: RStream): RStream {
    throw new Error("base SearchEdge does not implement run method");
  }
}

export class EdgeHasClassification extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:CLA"];
  }

  run(q: RStream): RStream {
    const targetEntityId = this.node.params.entityId;
    return q.concatMap(function (entity: RDatum<IEntity>) {
      return r
        .table(Relation.table)
        .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
        .filter({
          type: RelationEnums.Type.Classification,
        })
        .filter(function (relation: RDatum<RelationTypes.IRelation>) {
          return relation("entityIds").nth(0).eq(entity("id"));
        })
        .filter(function (relation: RDatum<RelationTypes.IRelation>) {
          if (targetEntityId) {
            return relation("entityIds").contains(targetEntityId);
          }
          return true;
        })
        .map(function (relation) {
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
    return q
      .filter(function (e: RDatum<IEntity>) {
        return e("class").eq("S");
      })
      .filter(function (e: RDatum<IEntity>) {
        return e("data")("territory")("territoryId").eq(territoryId);
      })
      .map(function (e) {
        return e("id");
      });
  }
}

export class EdgeHasRelation extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:"];
  }

  run(q: RStream): RStream {
    const targetEntityId = this.node.params.entityId;

    return q.concatMap(function (entity: RDatum<IEntity>) {
      return (
        r
          .table(Relation.table)
          .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
          // get all relations where any entity is the source entity
          .filter(function (relation: RDatum<RelationTypes.IRelation>) {
            return relation("entityIds").contains(entity("id"));
          })
          // check if the target entity is also in the relation
          .filter(function (relation: RDatum<RelationTypes.IRelation>) {
            if (targetEntityId) {
              return relation("entityIds").contains(targetEntityId);
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

export class EdgeCHasSuperclass extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:SCL"];
  }

  run(q: RStream): RStream {
    const sclEntityId = this.node.params.entityId;
    return q.concatMap(function (entity: RDatum<IEntity>) {
      return (
        r
          .table(Relation.table)
          .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
          .filter({
            type: RelationEnums.Type.Superclass,
          })
          // get all relations where the first entity is the source entity
          .filter(function (relation: RDatum<RelationTypes.IRelation>) {
            return relation("entityIds").nth(0).eq(entity("id"));
          })
          // check if the target entity is the desired superclass
          .filter(function (relation: RDatum<RelationTypes.IRelation>) {
            if (sclEntityId) {
              return relation("entityIds").nth(1).eq(sclEntityId);
            }
            return true;
          })
          .map(function (relation) {
            return relation("entityIds").nth(0);
          })
      );
    });
  }
}

export class EdgeHasSuperordinate extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["R:SOE"];
  }

  run(q: RStream): RStream {
    const soeEntityId = this.node.params.entityId;
    return q.concatMap(function (entity: RDatum<IEntity>) {
      return (
        r
          .table(Relation.table)
          .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
          .filter({
            type: RelationEnums.Type.SuperordinateEntity,
          })
          // the entity is the subordinate side (entityIds[0]); its superordinate
          // is entityIds[1] (mirrors SuperordinateEntity.getSuperordinate...
          // ForwardConnections, which recurses on entityIds[1])
          .filter(function (relation: RDatum<RelationTypes.IRelation>) {
            return relation("entityIds").nth(0).eq(entity("id"));
          })
          // check if the target entity is the desired superordinate
          .filter(function (relation: RDatum<RelationTypes.IRelation>) {
            if (soeEntityId) {
              return relation("entityIds").nth(1).eq(soeEntityId);
            }
            return true;
          })
          // emit the iterated entity itself (the subordinate), keeping the
          // subset invariant positive matching and negation rely on
          .map(function (relation) {
            return relation("entityIds").nth(0);
          })
      );
    });
  }
}

export class EdgeHasPropType extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["EP:T"];
  }

  run(q: RStream): RStream {
    const typeId = this.node.params.entityId;
    return q
      .filter(function (e: RDatum<IEntity>) {
        // some of the e.[props].type.entityId is entity.id
        return e("props")
          .filter(function (prop) {
            if (typeId) {
              return prop("type")("entityId").eq(typeId);
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
    const valueId = this.node.params.entityId;
    return q
      .filter(function (e: RDatum<IEntity>) {
        // some of the e.[props].value.entityId is entity.id
        return e("props")
          .filter(function (prop) {
            if (valueId) {
              return prop("value")("entityId").eq(valueId);
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
function collectStatementPropIds(
  propsExpr: RDatum,
  kind: "type" | "value"
): RDatum {
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
  targetId: string | undefined,
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
      if (targetId) {
        return ids.contains(targetId);
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
    return runStatementPropEdge(q, this.node.params.entityId, "type");
  }
}

export class EdgeStatementHasPropValue extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["SP:V"];
  }

  run(q: RStream): RStream {
    return runStatementPropEdge(q, this.node.params.entityId, "value");
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
 * Candidate statements that reference `targetId` via the given multi index
 * (StatementDataProps / StatementActantsCI). With no target the index cannot be
 * used, so fall back to scanning every statement.
 */
function candidateStatements(
  targetId: string | undefined,
  index: DbEnums.Indexes
): RStream {
  if (targetId) {
    return r
      .table(Entity.table)
      .getAll(targetId, { index }) as unknown as RStream;
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
  const characterised = (
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
      .distinct() as unknown as RDatum
  ).coerceTo("array");

  return characterised.do(function (ids: RDatum) {
    return q
      .filter(function (e: RDatum<IEntity>) {
        return ids.contains(e("id"));
      })
      .map(function (e: RDatum<IEntity>) {
        return e("id");
      });
  }) as unknown as RStream;
}

function runInverseStatementPropEdge(
  q: RStream,
  targetId: string | undefined,
  kind: "type" | "value"
): RStream {
  return emitMatchingActants(
    q,
    candidateStatements(targetId, DbEnums.Indexes.StatementDataProps),
    function (a: RDatum) {
      const ids = collectStatementPropIds(a("props"), kind);
      return targetId ? ids.contains(targetId) : ids.count().gt(0);
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
  targetId: string | undefined
): RStream {
  return emitMatchingActants(
    q,
    candidateStatements(targetId, DbEnums.Indexes.StatementActantsCI),
    function (a: RDatum) {
      const ids = a("classifications").map(function (c: RDatum) {
        return c("entityId");
      });
      return targetId ? ids.contains(targetId) : ids.count().gt(0);
    }
  );
}

export class EdgeIsStatementPropType extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_SP:T"];
  }

  run(q: RStream): RStream {
    return runInverseStatementPropEdge(q, this.node.params.entityId, "type");
  }
}

export class EdgeIsStatementPropValue extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_SP:V"];
  }

  run(q: RStream): RStream {
    return runInverseStatementPropEdge(q, this.node.params.entityId, "value");
  }
}

export class EdgeIsStatementClassification extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["I_SC"];
  }

  run(q: RStream): RStream {
    return runInverseStatementClassificationEdge(q, this.node.params.entityId);
  }
}

export class EdgeHasReferenceResource extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType["HR:R"];
  }

  run(q: RStream): RStream {
    const resourceId = this.node.params.entityId;
    return q
      .filter(function (e: RDatum<IEntity>) {
        // a few legacy entities (e.g. the root territory) store references as
        // "" instead of an array - treat any non-array as "no references"
        return r
          .branch(
            e("references").typeOf().eq("ARRAY"),
            e("references"),
            r.expr([] as any[])
          )
          .filter(function (ref: RDatum) {
            if (resourceId) {
              return ref("resource").eq(resourceId);
            }
            return true;
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
    default:
      throw new InternalServerError(`unknown edge type: ${data.type}`);
  }
}
