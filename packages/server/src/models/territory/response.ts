import { UserEnums } from "@shared/enums";
import { IEntity, IResponseStatement, IResponseTerritory, ITerritory } from "@shared/types";
import Territory from "./territory";
import Statement from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";

export class ResponseTerritory extends Territory implements IResponseTerritory {
  statements: IResponseStatement[];
  entities: { [key: string]: IEntity };
  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;

  constructor(entity: ITerritory) {
    super(entity);
    this.statements = [];
    this.entities = {};
  }

  async prepare(req: IRequest): Promise<void> {
    this.right = this.getUserRoleMode(req.getUserOrFail());

    const statements = await Statement.findStatementsInTerritory(
      req.db.connection,
      this.id
    );

    const entitiesList = await Entity.findEntitiesByIds(
      req.db.connection,
      Statement.getEntitiesIdsForMany(statements)
    );
    this.entities = entitiesList.reduce<{ [key: string]: IEntity }>(
      (acc, entity) => {
        acc[entity.id] = entity;
        return acc;
      },
      {}
    );

    for (const statement of statements) {
      const responseStatement = new ResponseStatement(new Statement(statement));
      await responseStatement.prepare(req);
      this.statements.push(responseStatement);
    }
  }
}
