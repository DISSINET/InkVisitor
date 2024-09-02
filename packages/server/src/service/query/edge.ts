import Relation from "@models/relation/relation";
import { Query } from "@shared/types/query";
import { r, RDatum, RStream } from "rethinkdb-ts";
import { SearchNode } from ".";
import { IEntity, Relation as RelationTypes } from "@shared/types";
import { DbEnums, RelationEnums } from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";

export default class SearchEdge implements Query.IEdge {
  type: Query.EdgeType;
  params: Query.IEdgeParams;
  logic: Query.EdgeLogic;
  node: SearchNode;

  constructor(data: Partial<Query.IEdge>) {
    this.type = data.type || ("" as Query.EdgeType);
    this.params = data.params || {};
    this.logic = data.logic || Query.EdgeLogic.Positive;
    this.node = new SearchNode(data?.node || {});
  }

  run(q: RStream): RStream {
    throw new Error("base SearchEdge does not implement run method");
  }
}

export class EdgeHasClassification extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType.XHasClassification;
  }

  run(q: RStream): RStream {
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
        .map(function (relation) {
          return relation("entityIds").nth(0);
        });
    });
  }
}

export class EdgeSUnderT extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType.SUnderT;
  }

  run(q: RStream): RStream {
    return q; // todo
  }
}

export class EdgeHasRelation extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType.XHasRelation;
  }

  run(q: RStream): RStream {
    return q.concatMap(function (entity: RDatum<IEntity>) {
      return r
        .table(Relation.table)
        .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
        .map(function () {
          return entity("id");
        });
    });
  }
}

export class EdgeHasSuperclass extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType.XHasSuperclass;
  }

  run(q: RStream): RStream {
    return q.concatMap(function (entity: RDatum<IEntity>) {
      return r
        .table(Relation.table)
        .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
        .filter({
          type: RelationEnums.Type.Superclass,
        })
        .filter(function (relation: RDatum<RelationTypes.IRelation>) {
          return relation("entityIds").nth(0).eq(entity("id")); // first element is specific class, second is super class
        })
        .map(function (relation) {
          return relation("entityIds").nth(0);
        });
    });
  }
}

export class EdgeHasPropType extends SearchEdge {
  constructor(data: Partial<Query.IEdge>) {
    super(data);
    this.type = Query.EdgeType.XHasPropType;
  }

  run(q: RStream): RStream {
    return q.concatMap(function (entity: RDatum<IEntity>) {
      return r
        .table(Relation.table)
        .getAll(entity("id"), { index: DbEnums.Indexes.PropsRecursive })
        .filter(function (propEntity: RDatum<IEntity>) {
          return true;
        })
        .map(function () {
          return entity;
        });
    });
  }
}

export function getEdgeInstance(data: Partial<Query.IEdge>): SearchEdge {
  switch (data.type) {
    case Query.EdgeType.XHasPropType:
      return new EdgeHasPropType(data);
    case Query.EdgeType.XHasClassification:
      return new EdgeHasClassification(data);
    case Query.EdgeType.XHasRelation:
      return new EdgeHasRelation(data);
    case Query.EdgeType.XHasSuperclass:
      return new EdgeHasSuperclass(data);
    case Query.EdgeType.SUnderT:
      return new EdgeSUnderT(data);
    default:
      throw new InternalServerError(`unknown edge type: ${data.type}`);
  }
}
