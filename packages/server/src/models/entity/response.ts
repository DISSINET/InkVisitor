import { Request } from "express";
import {
  EntityClass,
  Position,
  UsedInPosition,
  UserRoleMode,
} from "@shared/enums";
import {
  IEntity,
  IProp,
  IResponseDetail,
  IResponseEntity,
  IResponseUsedInMetaProp,
  IResponseUsedInStatement,
  IStatement,
} from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Entity from "./entity";
import Statement from "@models/statement/statement";
import Actant from "@models/actant/actant";

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
   * Walks through props arrays recursively to gather required entries for usedInMetaProps & usedInStatementProps fields.
   * Also populates entities map.
   * @param actant
   * @param props
   */
  walkPropsStatements(actant: IEntity, props: IProp[]) {
    for (const prop of props) {
      if (prop.type.id === this.id) {
        this.addUsedInMetaProp(actant, UsedInPosition.Type);
      }

      if (prop.value.id === this.id) {
        this.addUsedInMetaProp(actant, UsedInPosition.Value);
      }

      if (prop.children.length) {
        this.walkPropsStatements(actant, prop.children);
      }
    }
  }

  /**
   * add entry to usedInMetaProps, usedInStatementProps and entities fields
   * @param actant
   * @param position
   */
  addUsedInMetaProp(actant: IEntity, position: UsedInPosition) {
    this.usedInMetaProps.push({
      entityId: actant.id,
      position,
    });

    if (actant.class === EntityClass.Statement) {
      this.usedInStatementProps.push({
        statement: actant as IStatement,
        position,
        //originId: // todo
      });
    }

    this.entities[actant.id] = actant;
  }

  /**
   * Walks through basic statement fields to gather required entries for usedInStatement field.
   * Also populates entities map.
   * @param statements
   */
  walkLinkedStatements(statements: IStatement[]) {
    for (const statement of statements) {
      for (const action of statement.data.actions) {
        if (action.action === this.id) {
          this.addLinkedStatement(statement, UsedInPosition.Action);
        }
      }

      for (const actant of statement.data.actants) {
        if (actant.actant === this.id) {
          this.addLinkedStatement(statement, UsedInPosition.Actant);
        }
      }

      for (const tag of statement.data.tags) {
        if (tag === this.id) {
          this.addLinkedStatement(statement, UsedInPosition.Tag);
        }
      }
    }
  }

  /**
   * Adds statement to usedInStatement & entities fields
   * @param statement
   * @param position
   */
  addLinkedStatement(statement: IStatement, position: UsedInPosition) {
    this.usedInStatement.push({
      statement,
      position,
      // originId:
    });

    this.entities[statement.id] = statement;
  }

  /**
   * Loads additional fields to satisfy the IResponseDetail interface
   * @param req
   */
  async prepare(req: Request): Promise<void> {
    super.prepare(req);

    const usedInProps = await Actant.findUsedInProps(
      req.db.connection,
      this.id
    );

    for (const actant of usedInProps) {
      this.walkPropsStatements(actant, actant.props);
    }

    const usedInStatements = await Statement.findUsed(
      req.db.connection,
      this.id
    );

    this.walkLinkedStatements(usedInStatements);
  }
}
