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
    [RelationEnums.Type.Superclass]?: IResponseDetailRelationType<Relation.ISuperclass>,
    [RelationEnums.Type.SuperordinateLocation]?: IResponseDetailRelationType<Relation.ISuperordinateLocation>,
    [RelationEnums.Type.Synonym]?: IResponseDetailRelationType<Relation.ISynonym>,
    [RelationEnums.Type.Antonym]?: IResponseDetailRelationType<Relation.IAntonym>,
    [RelationEnums.Type.Holonym]?: IResponseDetailRelationType<Relation.IHolonym>,
    [RelationEnums.Type.PropertyReciprocal]?: IResponseDetailRelationType<Relation.IPropertyReciprocal>,
    [RelationEnums.Type.SubjectActant1Reciprocal]?: IResponseDetailRelationType<Relation.ISubjectActant1Reciprocal>,
    [RelationEnums.Type.ActionEventEquivalent]?: IResponseDetailRelationType<Relation.IActionEventEquivalent>,
    [RelationEnums.Type.Classification]?: IResponseDetailRelationType<Relation.IClassification>,
    [RelationEnums.Type.Identification]?: IResponseDetailRelationType<Relation.IIdentification>,
    [RelationEnums.Type.Implication]?: IResponseDetailRelationType<Relation.IImplication>,
    [RelationEnums.Type.SubjectSemantics]?: IResponseDetailRelationType<Relation.ISubjectSemantics>,
    [RelationEnums.Type.Actant1Semantics]?: IResponseDetailRelationType<Relation.IActant1Semantics>,
    [RelationEnums.Type.Actant2Semantics]?: IResponseDetailRelationType<Relation.IActant2Semantics>,
    [RelationEnums.Type.Related]?: IResponseDetailRelationType<Relation.IRelated>,
  };
}


//1st solutions
// export interface IResponseDetailRelationType<T> {
//   list: Relation.IRelation[];
//   inversedList?: Relation.IRelation[];
//   trees?: IRelationConnection<T>[]
// }

//2nd solutions
export interface IResponseDetailRelationType<T extends Relation.IRelation> {
  connections: IRelationConnection<T>[];
  iConnections?: IRelationConnection<T>[];
}
interface g {
  ds: String;
}
interface ttt<T extends {}> extends { ds: String } {

}

export type IRelationConnection<T extends Relation.IRelation> = T & {
  subtrees?: IRelationConnection<T>[];
};

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
