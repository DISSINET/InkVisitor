import Statement from "@models/statement/statement";
import { ResponseTerritory } from "@models/territory/response";
import Territory from "@models/territory/territory";
import { findEntityById } from "@service/shorthands";
import { EntityClass } from "@shared/enums";
import { IResponseTerritory, IStatement, ITerritory } from "@shared/types";
import {
  BadParams,
  PermissionDeniedError,
  TerritoryDoesNotExits,
} from "@shared/types/errors";
import { Request, Router } from "express";
import { asyncRouteHandler } from "..";

export default Router()
  .get(
    "/:territoryId",
    asyncRouteHandler<IResponseTerritory>(async (request: Request) => {
      const territoryId = request.params.territoryId;
      if (!territoryId) {
        throw new BadParams("territoryId has to be set");
      }

      const territory = await findEntityById<ITerritory>(
        request.db,
        territoryId
      );
      if (!territory || territory.class !== EntityClass.Territory) {
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
    "/:territoryId/entities",
    asyncRouteHandler<string[]>(async (request: Request) => {
      const territoryId = request.params.territoryId;
      if (!territoryId) {
        throw new BadParams("territoryId has to be set");
      }

      const territory = await findEntityById<ITerritory>(
        request.db,
        territoryId
      );
      if (!territory || territory.class !== EntityClass.Territory) {
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
  );
