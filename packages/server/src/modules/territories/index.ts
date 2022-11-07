import Statement from "@models/statement/statement";
import { ResponseTerritory } from "@models/territory/response";
import Territory from "@models/territory/territory";
import { findEntityById } from "@service/shorthands";
import { EntityEnums } from "@shared/enums";
import { IResponseTerritory, IStatement, ITerritory } from "@shared/types";
import {
  BadParams,
  PermissionDeniedError,
  TerritoryDoesNotExits,
} from "@shared/types/errors";
import { Router } from "express";
import { IRequest } from "src/custom_typings/request";
import { asyncRouteHandler } from "..";

export default Router()
  /**
   * @openapi
   * /territories/{territoryId}:
   *   get:
   *     description: Returns detail for territory entry
   *     tags:
   *       - territories
   *     parameters:
   *       - in: path
   *         name: territoryId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the territory entry
   *     responses:
   *       200:
   *         description: Returns IResponseTerritory object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseTerritory"
   */
  .get(
    "/:territoryId",
    asyncRouteHandler<IResponseTerritory>(async (request: IRequest) => {
      const territoryId = request.params.territoryId;
      if (!territoryId) {
        throw new BadParams("territoryId has to be set");
      }

      const territory = await findEntityById<ITerritory>(
        request.db,
        territoryId
      );
      if (!territory || territory.class !== EntityEnums.Class.Territory) {
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
  /**
   * @openapi
   * /territories/{territoryId}/entities:
   *   get:
   *     description: Returns entities associated with territory's statements
   *     tags:
   *       - territories
   *     parameters:
   *       - in: path
   *         name: territoryId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the territory entry
   *     responses:
   *       200:
   *         description: Returns list of ids
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: string
   */
  .get(
    "/:territoryId/entities",
    asyncRouteHandler<string[]>(async (request: IRequest) => {
      const territoryId = request.params.territoryId;
      if (!territoryId) {
        throw new BadParams("territoryId has to be set");
      }

      const territory = await findEntityById<ITerritory>(
        request.db,
        territoryId
      );
      if (!territory || territory.class !== EntityEnums.Class.Territory) {
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
