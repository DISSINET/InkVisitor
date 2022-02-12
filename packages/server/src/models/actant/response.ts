import { Request } from "express";
import {
  ActantType,
  Position,
  PositionContext,
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
  usedInStatement: IResponseUsedInStatement<Position | "action">[];
  usedInStatementProps: IResponseUsedInStatement<PositionContext>[];
  usedInMetaProps: IResponseUsedInMetaProp<PositionContext>[];

  constructor(actant: IActant) {
    super(actant);
    this.entities = {};
    this.usedInStatement = [];
    this.usedInStatementProps = [];
    this.usedInMetaProps = [];
  }

  walkProps(actant: IActant, props: IProp[]) {
    for (const prop of props) {
      if (prop.type.id === this.id) {
        this.usedInMetaProps.push({
          entityId: actant.id,
          position: PositionContext.Type,
        });
        if (actant.class === ActantType.Statement) {
          this.usedInStatementProps.push({
            statement: actant as IStatement,
            position: PositionContext.Type,
            //originId: // todo
          });
        }

        this.entities[actant.id] = actant;
      }
      if (prop.value.id === this.id) {
        this.usedInMetaProps.push({
          entityId: actant.id,
          position: PositionContext.Value,
        });
        if (actant.class === ActantType.Statement) {
          this.usedInStatementProps.push({
            statement: actant as IStatement,
            position: PositionContext.Value,
            //originId: // todo
          });
        }

        this.entities[actant.id] = actant;
      }

      this.walkProps(actant, prop.children);
    }
  }

  walkBasicStatements(statements: IStatement[]) {
    for (const statement of statements) {
      for (const action of statement.data.actions) {
        if (action.action === this.id) {
          this.usedInStatement.push({
            position: "action",
            statement: statement,
            // originId:
          });

          this.entities[statement.id] = statement;
        }
      }

      for (const actant of statement.data.actants) {
        this.usedInStatement.push({
          position: Position.Actant1,
          statement: statement,
          // originId:
        });

        this.entities[statement.id] = statement;
      }

      for (const tag of statement.data.tags) {
        this.usedInStatement.push({
          position: Position.PseudoActant,
          statement: statement,
          // originId:
        });

        this.entities[statement.id] = statement;
      }
    }
  }

  async prepare(req: Request): Promise<void> {
    super.prepare(req);

    const usedInProps = await Actant.findUsedInProps(
      req.db.connection,
      this.id
    );

    for (const actant of usedInProps) {
      this.walkProps(actant, actant.props);
    }

    const usedInStatements = await Statement.findUsed(
      req.db.connection,
      this.id
    );

    this.walkBasicStatements(usedInStatements);
  }
}
