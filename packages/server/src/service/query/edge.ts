import Relation from "@models/relation/relation";
import { DbEnums, RelationEnums } from "@shared/enums";
import { IEntity, Relation as RelationTypes } from "@shared/types";
import { InternalServerError } from "@shared/types/errors";
import { Query } from "@shared/types/query";
import { r, RDatum, RStream } from "rethinkdb-ts";
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
          .map(function (relation) {
            return relation("entityIds").nth(0);
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

export function getEdgeInstance(data: Partial<Query.IEdge>): SearchEdge {
  switch (data.type) {
    case Query.EdgeType["EP:T"]:
      return new EdgeHasPropType(data);
    case Query.EdgeType["R:"]:
      return new EdgeHasRelation(data);
    case Query.EdgeType["R:CLA"]:
      return new EdgeHasClassification(data);
    case Query.EdgeType["R:SCL"]:
      return new EdgeCHasSuperclass(data);
    case Query.EdgeType["SUT:"]:
      return new EdgeSUnderT(data);
    default:
      throw new InternalServerError(`unknown edge type: ${data.type}`);
  }
}
