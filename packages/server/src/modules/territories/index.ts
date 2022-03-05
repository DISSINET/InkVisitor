import Statement from "@models/statement/statement";
import { ResponseTerritory } from "@models/territory/response";
import Territory from "@models/territory/territory";
import { findEntityById, findEntities } from "@service/shorthands";
import { EntityClass } from "@shared/enums";
import {
  IResponseGeneric,
  IResponseTerritory,
  IStatement,
  ITerritory,
} from "@shared/types";
import {
  BadParams,
  PermissionDeniedError,
  StatementDoesNotExits,
  StatementInvalidMove,
  TerritoryDoesNotExits,
} from "@shared/types/errors";
import { Request, Router } from "express";
import { asyncRouteHandler } from "..";

function insertIStatementToChilds(
  array: IStatement[],
  onIndex: number,
  item: IStatement
): IStatement[] {
  return [...array.slice(0, onIndex), item, ...array.slice(onIndex)];
}

const sortStatements = (terA: IStatement, terB: IStatement): number => {
  if (terA.data.territory && terB.data.territory) {
    return terA.data.territory.order - terB.data.territory.order;
  } else {
    return 0;
  }
};

export default Router()
  .get(
    "/get/:territoryId?",
    asyncRouteHandler<IResponseTerritory>(async (request: Request) => {
      const territoryId = request.params.territoryId;
      if (!territoryId) {
        throw new BadParams("territoryId has to be set");
      }

      const territory = await findEntityById<ITerritory>(
        request.db,
        territoryId,
        {
          class: EntityClass.Territory,
        }
      );
      if (!territory) {
        throw new TerritoryDoesNotExits(
          `territory ${territoryId} was not found`,
          territoryId
        );
      }

      if (
        !new Territory({ id: territoryId }).canBeViewedByUser(
          request.getUserOrFail()
        )
      ) {
        throw new PermissionDeniedError(`cannot view entity ${territoryId}`);
      }

      const response = new ResponseTerritory(territory);
      await response.prepare(request);

      return response;
    })
  )
  .get(
    "/getEntityIds/:territoryId?",
    asyncRouteHandler<string[]>(async (request: Request) => {
      const territoryId = request.params.territoryId;
      if (!territoryId) {
        throw new BadParams("territoryId has to be set");
      }

      const territory = await findEntityById<ITerritory>(
        request.db,
        territoryId,
        {
          class: EntityClass.Territory,
        }
      );
      if (!territory) {
        throw new TerritoryDoesNotExits(
          `territory ${territoryId} was not found`,
          territoryId
        );
      }

      const dependentStatements: IStatement[] =
        await Statement.findStatementsInTerritory(
          request.db.connection,
          territoryId
        );

      return Statement.getEntitiesIdsForMany(dependentStatements);
    })
  )
  .post(
    "/moveStatement",

    //@ts-ignore
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const moveId = request.body.moveId;
      const newIndex = request.body.newIndex;

      if (!moveId || newIndex === undefined) {
        throw new BadParams("moveId/newIndex has be set");
      }

      const statement: IStatement = await findEntityById<IStatement>(
        request.db,
        moveId
      );

      if (!statement.data.territory) {
        throw new StatementDoesNotExits(
          `statement ${moveId} has no territory`,
          moveId
        );
      }

      if (!statement) {
        throw new StatementDoesNotExits(
          `statement ${moveId} does not exist`,
          moveId
        );
      }

      const territory: ITerritory = await findEntityById<ITerritory>(
        request.db,
        statement.data.territory.id
      );
      if (!territory) {
        throw new TerritoryDoesNotExits(
          `territory ${statement.data.territory.id} does not exist`,
          statement.data.territory.id
        );
      }

      const out: IResponseGeneric = {
        result: true,
      };

      let statementsForTerritory = (
        await findEntities<IStatement>(request.db, {
          class: EntityClass.Statement,
        })
      )
        .filter((s) => s.data.territory && s.data.territory.id === territory.id)
        .sort(sortStatements);
      if (newIndex < 0 || newIndex > statementsForTerritory.length) {
        throw new StatementInvalidMove(
          "cannot move statement to invalid index"
        );
      }

      const currentIndex = statementsForTerritory.findIndex(
        (s) => s.id === moveId
      );
      if (currentIndex === -1) {
        // statement is not present in the array
        throw new StatementInvalidMove("statement not present in the array");
      }
      if (currentIndex === newIndex) {
        throw new StatementInvalidMove("already on the position");
      }
      statementsForTerritory.splice(currentIndex, 1);

      statementsForTerritory = insertIStatementToChilds(
        statementsForTerritory,
        newIndex,
        statement
      );

      for (let i = 0; i < statementsForTerritory.length; i++) {
        const statement = new Statement({ ...statementsForTerritory[i] });
        statement.data.territory.order = i + 1;
        await statement.update(request.db.connection, {
          data: statement.data,
        });
        return out;
      }
    })
  );
