import Relation from "@models/relation/relation";
import { Search } from "@shared/types/search";
import {
  Connection,
  RTable,
  r,
  RDatum,
  RStream,
  RValue,
  RQuery,
} from "rethinkdb-ts";
import { SearchNode } from ".";
import { IEntity, Relation as RelationTypes } from "@shared/types";
import { DbEnums, RelationEnums } from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";

export default class SearchEdge implements Search.IEdge {
  type: Search.EdgeType;
  params: Search.IEdgeParams;
  logic: Search.EdgeLogic;
  node: SearchNode;

  constructor(data: Partial<Search.IEdge>) {
    this.type = data.type || ("" as Search.EdgeType);
    this.params = data.params || {};
    this.logic = data.logic || Search.EdgeLogic.Positive;
    this.node = new SearchNode(data?.node || {});
  }

  run(q: RStream): RStream {
    throw new Error("base SearchEdge does not implement run method");
  }
}

export class EdgeHasClassification extends SearchEdge {
  constructor(data: Partial<Search.IEdge>) {
    super(data);
    this.type = Search.EdgeType.XHasClassification;
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
        .map(function () {
          return entity;
        });
    });
  }
}

export class EdgeSUnderT extends SearchEdge {
  constructor(data: Partial<Search.IEdge>) {
    super(data);
    this.type = Search.EdgeType.SUnderT;
  }

  run(q: RStream): RStream {
    return q; // todo
  }
}

export class EdgeHasRelation extends SearchEdge {
  constructor(data: Partial<Search.IEdge>) {
    super(data);
    this.type = Search.EdgeType.XHasRelation;
  }

  run(q: RStream): RStream {
    return q.concatMap(function (entity: RDatum<IEntity>) {
      return r
        .table(Relation.table)
        .getAll(entity("id"), { index: DbEnums.Indexes.RelationsEntityIds })
        .map(function () {
          return entity;
        });
    });
  }
}

export function getEdgeInstance(data: Partial<Search.IEdge>) {
  switch (data.type) {
    case Search.EdgeType.XHasClassification:
      return new EdgeHasClassification(data);
    case Search.EdgeType.XHasRelation:
      return new EdgeHasRelation(data);
    case Search.EdgeType.SUnderT:
      return new EdgeSUnderT(data);
    default:
      throw new InternalServerError("unknown edge type");
  }
}
