import { Router, Request } from "express";
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
import { EntityClass } from "@shared/enums";
import treeCache, { TreeCreator } from "@service/treeCache";

export default Router()
  .get(
    "/get",
    asyncRouteHandler<IResponseTree>(async (request: Request) => {
      return treeCache.forUser(request.getUserOrFail());
    })
  )
  .post(
    "/moveTerritory",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const moveId = request.body.moveId;
      const parentId = request.body.parentId;
      const newIndex = request.body.newIndex;

      if (!moveId || !parentId || newIndex === undefined) {
        throw new BadParams("moveId/parentId/newIndex has be set");
      }

      // check child territory
      const territoryData = await findEntityById<ITerritory>(
        request.db,
        moveId,
        {
          class: EntityClass.Territory,
        }
      );
      if (!territoryData) {
        throw new TerritoryDoesNotExits(
          `territory ${moveId} does not exist`,
          moveId
        );
      }
      if (
        !new Territory({ ...territoryData }).canBeEditedByUser(
          request.getUserOrFail()
        )
      ) {
        throw new PermissionDeniedError(`cannot edit territorty ${moveId}`);
      }

      // check parent territory
      const parent = await findEntityById<ITerritory>(request.db, parentId, {
        class: EntityClass.Territory,
      });
      if (!parent) {
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
      } else if (territoryData.data.parent.id !== parentId) {
        // change parent of the territory
        territoryData.data.parent.id = parentId;
        territoryData.data.parent.order = -1;
      } else {
        const currentIndex = childsArray.findIndex((ter) => ter.id === moveId);
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
