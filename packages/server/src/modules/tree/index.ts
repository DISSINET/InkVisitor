import { Router } from "express";
import { findEntityById } from "@service/shorthands";
import {
  BadParams,
  PermissionDeniedError,
  TerritoryDoesNotExits,
  TerrytoryInvalidMove,
} from "@shared/types/errors";
import { asyncRouteHandler } from "..";
import { IResponseGeneric, IResponseTree, ITerritory } from "@shared/types";
import Territory from "@models/territory/territory";
import { IParentTerritory } from "@shared/types/territory";
import { EntityEnums } from "@shared/enums";
import treeCache, { TreeCreator } from "@service/treeCache";
import { IRequest } from "src/custom_typings/request";

export default Router()
  /**
   * @openapi
   * /tree:
   *   get:
   *     description: Returns available territories tree
   *     tags:
   *       - tree
   *     responses:
   *       200:
   *         description: Returns IResponseTree object
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items: 
   *                 $ref: "#/components/schemas/IResponseTree"
   */
  .get(
    "/",
    asyncRouteHandler<IResponseTree>(async (request: IRequest) => {
      return treeCache.forUser(request.getUserOrFail());
    })
  )
  /**
   * @openapi
   * /tree/{territoryId}/position:
   *   patch:
   *     description: Updates the position of child territory
   *     tags:
   *       - tree
   *     parameters:
   *       - in: path
   *         name: territoryId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the territory entry
   *     requestBody:
   *       description: Position data
   *       content: 
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               parentId: 
   *                 type: string
   *               newIndex:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .patch(
    "/:territoryId/position",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const territoryId = request.params.territoryId as string;
      const parentId = request.body.parentId as string;
      const newIndex = request.body.newIndex as number;

      if (!territoryId || !parentId || newIndex === undefined) {
        throw new BadParams("moveId/parentId/newIndex has be set");
      }

      await request.db.lock();

      // check child territory
      const territoryData = await findEntityById<ITerritory>(
        request.db,
        territoryId
      );
      if (!territoryData || territoryData.class !== EntityEnums.Class.Territory) {
        throw new TerritoryDoesNotExits(
          `territory ${territoryId} does not exist`,
          territoryId
        );
      }
      if (
        !new Territory({ ...territoryData }).canBeEditedByUser(
          request.getUserOrFail()
        )
      ) {
        throw new PermissionDeniedError(
          `cannot edit territorty ${territoryId}`
        );
      }

      // check parent territory
      const parent = await findEntityById<ITerritory>(request.db, parentId);
      if (!parent || parent.class !== EntityEnums.Class.Territory) {
        throw new TerritoryDoesNotExits(
          `parent territory ${parentId} does not exist`,
          parentId
        );
      }
      if (
        !new Territory({ ...parent }).canBeEditedByUser(request.getUserOrFail())
      ) {
        throw new PermissionDeniedError(
          `cannot edit parent territorty ${parentId}`
        );
      }

      // alter data below
      const childsMap = await new Territory({ ...parent }).findChilds(
        request.db.connection
      );
      const childsArray = Object.values(childsMap).sort(
        TreeCreator.sortTerritories
      );

      if (newIndex < 0 || newIndex > childsArray.length) {
        throw new TerrytoryInvalidMove(
          "cannot move territory to invalid index"
        );
      }

      const out: IResponseGeneric = {
        result: true,
      };

      if (!territoryData.data.parent) {
        // root territory cannot be moved - or not yet implemented
        throw new TerrytoryInvalidMove("cannot move root territory");
      } else if (territoryData.data.parent.territoryId !== parentId) {
        // change parent of the territory
        territoryData.data.parent.territoryId = parentId;
        territoryData.data.parent.order = -1;
      } else {
        const currentIndex = childsArray.findIndex(
          (ter) => ter.id === territoryId
        );
        if (currentIndex === -1) {
          throw new TerrytoryInvalidMove("territory not found in the array");
        }

        const goingUp = currentIndex > newIndex;

        // newIndex is just the n-th element, does not reflect the order value
        let newOrderValue: number;

        if (goingUp && newIndex == 0) {
          // move to be the first element - special case - we don't want to assign the same order value
          newOrderValue =
            (childsArray[0].data.parent as IParentTerritory).order - 1;
        } else {
          newOrderValue = (
            childsArray[goingUp ? newIndex - 1 : newIndex].data
              .parent as IParentTerritory
          ).order;
        }

        territoryData.data.parent.order = newOrderValue;
      }

      const childTerritory = new Territory({ ...territoryData });
      childTerritory.setSiblings(childsMap);
      await childTerritory.update(request.db.connection, {
        data: childTerritory.data,
      });

      return out;
    })
  );
