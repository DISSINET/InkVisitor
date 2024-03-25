import Statement from "@models/statement/statement";
import { ResponseTerritory } from "@models/territory/response";
import Territory from "@models/territory/territory";
import { findEntityById } from "@service/shorthands";
import { EntityEnums } from "@shared/enums";
import {
  IResponseGeneric,
  IResponseTerritory,
  IStatement,
  ITerritory,
} from "@shared/types";
import {
  BadParams,
  PermissionDeniedError,
  TerritoryDoesNotExits,
} from "@shared/types/errors";
import { Router } from "express";
import { IRequest } from "src/custom_typings/request";
import { asyncRouteHandler } from "..";
import Entity from "@models/entity/entity";
import treeCache from "@service/treeCache";
import tree from "@modules/tree";

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
  )
  .post(
    "/:territoryId/copy",
    asyncRouteHandler<IResponseGeneric>(
      async (
        request: IRequest<
          { territoryId: string },
          { withChildren?: boolean; targets: string[] }
        >
      ) => {
        const territoryId = request.params.territoryId;
        if (!territoryId) {
          throw new BadParams("territoryId has to be set");
        }
        if (territoryId === "T0") {
          throw new BadParams("cannot use root territory");
        }

        await request.db.lock();

        const territoryData = await findEntityById<ITerritory>(
          request.db,
          territoryId
        );
        if (!territoryData || territoryData.class !== EntityEnums.Class.Territory) {
          throw new TerritoryDoesNotExits(
            `territory ${territoryId} was not found`,
            territoryId
          );
        }

        const territory = new Territory(territoryData);

        const withChildren = !!request.body.withChildren;
        const targetIds = request.body.targets || [];
        const tgts = await Entity.findEntitiesByIds(
          request.db.connection,
          targetIds
        );
        if (!tgts || !tgts.length || tgts.length !== targetIds.length) {
          throw new TerritoryDoesNotExits(
            "one or more target territories not found",
            targetIds.join(",")
          );
        }
        
        const childs = await territory.findChilds(request.db.connection);

        const copyUnderTarget = async (
          targetId: string,
          original: ITerritory,
          childs: ITerritory[]
        ) => {
          const targetT = new Territory({ id: targetId });
          const targetChilds = await targetT.findChilds(request.db.connection);
          const lastOrder = Object.keys(targetChilds)
            .filter((key) => !isNaN(parseInt(key)))
            .reduce((max, key) => Math.max(max, parseInt(key)), -Infinity);

          const newT = new Territory({
            ...original,
            id: undefined,
            label: `COPY OF ${original.label}`,
            data: {
              parent: {
                order: lastOrder + 1,
                territoryId: targetId,
              },
            },
          });
          await newT.save(request.db.connection);

          if (withChildren) {
            for (const child of childs) {
              await copyUnderTarget(newT.id, child, []);            
            }
          }
        };

        for (const target of tgts) {
          await copyUnderTarget(target.id, territory, Object.values(childs));
        }

        return {
          result: true,
        };
      }
    )
  );
