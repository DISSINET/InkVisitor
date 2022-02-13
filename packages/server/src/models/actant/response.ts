import { Request } from "express";
import {
  ActantType,
  Position,
  UsedInPosition,
  UserRoleMode,
} from "@shared/enums";
import {
  IActant,
  IProp,
  IResponseActant,
  IResponseDetail,
  IStatement,
  IResponseUsedInMetaProp,
  IResponseUsedInStatement,
} from "@shared/types";
import Actant from "./actant";
import Statement from "@models/statement/statement";

export class ResponseActant extends Actant implements IResponseActant {
  right: UserRoleMode = UserRoleMode.Read;

  constructor(actant: IActant) {
    super({});
    for (const key of Object.keys(actant)) {
      (this as any)[key] = (actant as any)[key];
    }
  }

  async prepare(request: Request) {
    this.right = this.getUserRoleMode(request.getUserOrFail());
  }
}

export class ResponseActantDetail
  extends ResponseActant
  implements IResponseDetail
{
  entities: { [key: string]: IActant };
  usedInStatement: IResponseUsedInStatement<UsedInPosition>[];
  usedInStatementProps: IResponseUsedInStatement<UsedInPosition>[];
  usedInMetaProps: IResponseUsedInMetaProp<UsedInPosition>[];

  constructor(actant: IActant) {
    super(actant);
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
  walkPropsStatements(actant: IActant, props: IProp[]) {
    for (const prop of props) {
      if (prop.type.id === this.id) {
        this.addUsedInMetaProp(actant, UsedInPosition.Type);
      }

      if (prop.value.id === this.id) {
        this.addUsedInMetaProp(actant, UsedInPosition.Value);
      }

      this.walkPropsStatements(actant, prop.children);
    }
  }

  /**
   * add entry to usedInMetaProps, usedInStatementProps and entities fields
   * @param actant
   * @param position
   */
  addUsedInMetaProp(actant: IActant, position: UsedInPosition) {
    this.usedInMetaProps.push({
      entityId: actant.id,
      position,
    });

    if (actant.class === ActantType.Statement) {
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
