/**
 * Very extensive object showing all the details about one actant
 */

import { IEntity, Relation, IResponseEntity, IStatement, IWarning } from ".";
import { EntityEnums } from "../enums";
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

  relations: Relation.IUsedRelations;

  warnings: IWarning[];
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
