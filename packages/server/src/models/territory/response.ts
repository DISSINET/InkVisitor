import { request, Request } from "express";
import { UserRoleMode } from "@shared/enums";
import { IActant, IResponseStatement, IResponseTerritory } from "@shared/types";
import Territory from ".";
import Statement from "@models/statement";
import { findActantsById, findActantsByIds } from "@service/shorthands";

export class ResponseTerritory extends Territory implements IResponseTerritory {
  statements: IResponseStatement[];
  actants: IActant[];
  right: UserRoleMode = UserRoleMode.Read;

  constructor(actant: IActant) {
    super(actant);

    this.statements = [];
    this.actants = [];
  }

  async prepare(req: Request): Promise<void> {
    this.right = this.getUserRoleMode(request.getUserOrFail());

    const statements = await Statement.findStatementsInTerritory(
      req.db.connection,
      this.id
    );

    const actantIds = Statement.getEntitiesIdsForMany(statements);
    this.actants = await findActantsById(req.db, actantIds);

    for (const statement of statements) {
      const entities = await findActantsByIds(
        req.db,
        statement.data.actions.map((a) => a.action)
      );

      this.statements.push({
        ...statement,
        entities: Object.assign({}, ...entities.map((x) => ({ [x.id]: x }))),
      });
    }
  }
}
