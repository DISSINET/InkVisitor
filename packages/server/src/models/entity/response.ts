import { Request } from "express";
import { UsedInPosition, UserRoleMode } from "@shared/enums";
import {
  IEntity,
  IProp,
  IResponseDetail,
  IResponseEntity,
  IResponseUsedInMetaProp,
  IResponseUsedInStatement,
  IStatement,
} from "@shared/types";
import Entity from "./entity";
import Statement from "@models/statement/statement";

export class ResponseEntity extends Entity implements IResponseEntity {
  right: UserRoleMode = UserRoleMode.Read;

  constructor(entity: IEntity) {
    super({});
    for (const key of Object.keys(entity)) {
      (this as any)[key] = (entity as any)[key];
    }
  }

  /**
   * Loads additional fields to satisfy the IResponseDetail interface
   * @param req
   */
  async prepare(request: Request) {
    this.right = this.getUserRoleMode(request.getUserOrFail());
  }
}

export class ResponseEntityDetail
  extends ResponseEntity
  implements IResponseDetail
{
  entities: { [key: string]: IEntity };
  usedInStatement: IResponseUsedInStatement<UsedInPosition>[];
  usedInStatementProps: IResponseUsedInStatement<UsedInPosition>[];
  usedInMetaProps: IResponseUsedInMetaProp<UsedInPosition>[];

  constructor(entity: IEntity) {
    super(entity);
    this.entities = {};
    this.usedInStatement = [];
    this.usedInStatementProps = [];
    this.usedInMetaProps = [];
  }

  /**
   * Loads additional fields to satisfy the IResponseDetail interface
   * @param req
   */
  async prepare(req: Request): Promise<void> {
    super.prepare(req);

    const usedInEntityProps = await Entity.findUsedInProps(
      req.db.connection,
      this.id
    );

    for (const entity of usedInEntityProps) {
      this.walkEntityProps(entity, entity.props);
    }

    this.walkStatementsDataEntities(
      await Statement.findUsedInDataEntities(req.db.connection, this.id)
    );

    this.walkStatementsDataProps(
      await Statement.findUsedInDataProps(req.db.connection, this.id)
    );

    const dependentEntities = await this.getEntities(req.db.connection);
    for (const key in dependentEntities) {
      this.entities[key] = dependentEntities[key];
    }
  }

  /**
   * Walks through props array recursively to gather required entries for addUsedInMetaProp method.
   * @param actant
   * @param props
   */
  walkEntityProps(actant: IEntity, props: IProp[]) {
    for (const prop of props) {
      if (prop.type.id === this.id) {
        this.addUsedInMetaProp(actant, UsedInPosition.Type);
      }

      if (prop.value.id === this.id) {
        this.addUsedInMetaProp(actant, UsedInPosition.Value);
      }

      if (prop.children.length) {
        this.walkEntityProps(actant, prop.children);
      }
    }
  }

  /**
   * add entry to usedInMetaProps and entities fields
   * @param actant
   * @param position
   */
  addUsedInMetaProp(actant: IEntity, position: UsedInPosition) {
    this.usedInMetaProps.push({
      entityId: actant.id,
      position,
    });

    this.entities[actant.id] = actant;
  }

  /**
   * Walks through data-entities arrays to gather required entries for addUsedInStatement method.
   * @param statements
   */
  walkStatementsDataEntities(statements: IStatement[]) {
    for (const statement of statements) {
      for (const action of statement.data.actions) {
        if (action.action === this.id) {
          this.addUsedInStatement(statement, UsedInPosition.Action);
        }
      }

      for (const actant of statement.data.actants) {
        if (actant.actant === this.id) {
          this.addUsedInStatement(statement, UsedInPosition.Actant);
        }
      }

      for (const tag of statement.data.tags) {
        if (tag === this.id) {
          this.addUsedInStatement(statement, UsedInPosition.Tag);
        }
      }
    }
  }

  /**
   * Adds statement to usedInStatement & entities fields
   * @param statement
   * @param position
   */
  addUsedInStatement(statement: IStatement, position: UsedInPosition) {
    this.usedInStatement.push({
      statement,
      position,
    });

    this.entities[statement.id] = statement;
  }

  /**
   * Walks through statements data-entities and call walkStatementDataRecursiveProps method accordingly.
   * @param statements
   */
  walkStatementsDataProps(statements: IStatement[]) {
    for (const statement of statements) {
      for (const action of statement.data.actions) {
        this.walkStatementDataRecursiveProps(
          statement,
          action.id,
          action.props
        );
      }

      for (const actant of statement.data.actants) {
        this.walkStatementDataRecursiveProps(
          statement,
          actant.id,
          actant.props
        );
      }
    }
  }

  /**
   * Adds statement to usedInStatement & entities fields
   * @param statement
   * @param originId
   * @param props
   */
  walkStatementDataRecursiveProps(
    statement: IStatement,
    originId: string,
    props: IProp[]
  ) {
    for (const prop of props) {
      if (prop.type.id === this.id) {
        this.addUsedInStatementProp(statement, UsedInPosition.Type, originId);
      }

      if (prop.value.id === this.id) {
        this.addUsedInStatementProp(statement, UsedInPosition.Value, originId);
      }

      if (prop.children.length) {
        this.walkStatementDataRecursiveProps(
          statement,
          originId,
          prop.children
        );
      }
    }
  }

  /**
   * add entry to usedInStatementProps and entities fields
   * @param statement
   * @param position
   * @param originId
   */
  addUsedInStatementProp(
    statement: IStatement,
    position: UsedInPosition,
    originId: string
  ) {
    this.usedInStatementProps.push({
      statement,
      position,
      originId,
    });

    this.entities[statement.id] = statement;
  }
}
