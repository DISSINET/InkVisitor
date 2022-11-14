/**
 * Very extensive object showing all the details about one actant
 */

import { IEntity, Relation, IResponseEntity, IStatement } from ".";
import { EntityEnums, RelationEnums } from "../enums";
import {
  IStatementClassification,
  IStatementIdentification,
} from "./statement";

export interface IResponseDetail extends IResponseEntity {
  entities: Record<string, IEntity>; // all entities from IStatement and entityIds...
  usedInStatements: IResponseUsedInStatement<EntityEnums.UsedInPosition>[]; // all statements, where the detail id is used as an actant, action, or tag
  usedInStatementProps: IResponseUsedInStatementProps[]; // all statements, where the detail id is used in props
  usedInMetaProps: IResponseUsedInMetaProp[]; // all entities, where the detail id is used in props (entity.props[])

  usedInStatementIdentifications: IResponseUsedInStatementIdentification[]; // statement.data.actants[].identifications + from usedInStatements field if actant.entityId = detailId
  usedInStatementClassifications: IResponseUsedInStatementClassification[]; // statement.data.actants[].classifications + from usedInStatements field if actant.entityId = detailId

  usedAsTemplate?: string[];
  
  relations: {
    [RelationEnums.Type.Superclass]: IResponseDetailRelationType<RelationEnums.Type.Superclass>,
    [RelationEnums.Type.SuperordinateLocation]: IResponseDetailRelationType<RelationEnums.Type.SuperordinateLocation>,
    [RelationEnums.Type.Synonym]: IResponseDetailRelationType<RelationEnums.Type.Synonym>,
    [RelationEnums.Type.Antonym]: IResponseDetailRelationType<RelationEnums.Type.Antonym>,
    [RelationEnums.Type.Holonym]: IResponseDetailRelationType<RelationEnums.Type.Holonym>,
    [RelationEnums.Type.PropertyReciprocal]: IResponseDetailRelationType<RelationEnums.Type.PropertyReciprocal>,
    [RelationEnums.Type.SubjectActant1Reciprocal]: IResponseDetailRelationType<RelationEnums.Type.SubjectActant1Reciprocal>,
    [RelationEnums.Type.ActionEventEquivalent]: IResponseDetailRelationType<RelationEnums.Type.ActionEventEquivalent>,
    [RelationEnums.Type.Classification]: IResponseDetailRelationType<RelationEnums.Type.Classification>,
    [RelationEnums.Type.Identification]: IResponseDetailRelationType<RelationEnums.Type.Identification>,
    [RelationEnums.Type.Implication]: IResponseDetailRelationType<RelationEnums.Type.Implication>,
    [RelationEnums.Type.SubjectSemantics]: IResponseDetailRelationType<RelationEnums.Type.SubjectSemantics>,
    [RelationEnums.Type.Actant1Semantics]: IResponseDetailRelationType<RelationEnums.Type.Actant1Semantics>,
    [RelationEnums.Type.Actant2Semantics]: IResponseDetailRelationType<RelationEnums.Type.Actant2Semantics>,
    [RelationEnums.Type.Related]: IResponseDetailRelationType<RelationEnums.Type.Related>,
  };
}


//1st solutions
// export interface IResponseDetailRelationType<T> {
//   list: Relation.IRelation[];
//   inversedList?: Relation.IRelation[];
//   trees?: IRelationConnection<T>[]
// }

//2nd solutions
export interface IResponseDetailRelationType<T> {
  connections: IRelationConnection<T>[];
  iConnections?: IRelationConnection<T>[];
}

export interface IRelationConnection<T> extends Relation.IRelation {
  subtrees?: IRelationConnection<T>[]
}


export interface IResponseUsedInStatement<PositionEnum> {
  statement: IStatement;
  position: PositionEnum;
}

export interface IResponseUsedInStatementProps {
  statementId: string;
  typeId: string;
  valueId: string;
  originId: string; // what entity is the detail id used for
}

export interface IResponseUsedInMetaProp {
  typeId: string;
  valueId: string;
  originId: string; // what entity is the detail id used for
}

export interface IResponseUsedInStatementIdentification {
  statementId: string;
  actantEntityId: string;
  relationEntityId: string;
  data: IStatementIdentification;
}

export interface IResponseUsedInStatementClassification {
  statementId: string;
  actantEntityId: string;
  relationEntityId: string;
  data: IStatementClassification; // this is a duplicate in some values, but probably the cleanest possible way
}
