import { Router, Request } from "express";
import {
  findActantById,
  getActants,
  updateActant,
  getTerritoryChilds,
} from "@service/shorthands";
import {
  BadParams,
  TerritoriesBrokenError,
  TerritoryDoesNotExits,
  TerrytoryInvalidMove,
} from "@common/errors";
import { asyncRouteHandler } from "..";
import { IResponseGeneric, IResponseTree, ITerritory } from "@shared/types";

function populateTree(
  root: ITerritory,
  parentMap: Record<string, ITerritory[]>,
  lvl: number
): IResponseTree {
  const childs = parentMap[root.id]
    ? parentMap[root.id].map((ter) => populateTree(ter, parentMap, lvl + 1))
    : [];
  return {
    territory: root,
    statementsCount: 0, // for now
    lvl,
    children: childs,
  };
}

function insertTerritoryToChilds(
  array: ITerritory[],
  onIndex: number,
  item: ITerritory
): ITerritory[] {
  return [...array.slice(0, onIndex), item, ...array.slice(onIndex)];
}

const sortTerritories = (terA: ITerritory, terB: ITerritory): number =>
  (terA.data.parent ? terA.data.parent.order : 0) -
  (terB.data.parent ? terB.data.parent.order : 0);

export default Router()
  .get(
    "/get",
    asyncRouteHandler<IResponseTree>(async (request: Request) => {
      const territories = (
        await getActants<ITerritory>(request.db, {
          class: "T",
        })
      ).sort(sortTerritories);

      const parentMap: Record<string, ITerritory[]> = {};
      for (const territory of territories) {
        if (typeof territory.data.parent === "undefined") {
          continue;
        }

        const parentId: string = territory.data.parent
          ? territory.data.parent.id
          : "";
        if (!parentMap[parentId]) {
          parentMap[parentId] = [];
        }
        parentMap[parentId].push(territory);
      }

      let root: ITerritory;
      if (parentMap[""].length != 1) {
        throw new TerritoriesBrokenError("Territories tree is broken");
      } else {
        root = parentMap[""][0];
      }

      return populateTree(root, parentMap, 0);
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

      const territory = await findActantById<ITerritory>(request.db, moveId, {
        class: "T",
      });
      if (!territory) {
        throw new TerritoryDoesNotExits("territory does not exist");
      }

      const parent = await findActantById<ITerritory>(request.db, parentId, {
        class: "T",
      });
      if (!parent) {
        throw new TerritoryDoesNotExits("territory does not exist");
      }

      let childs = (await getTerritoryChilds(request.db, parentId)).sort(
        sortTerritories
      );
      if (newIndex < 0 || newIndex > childs.length) {
        throw new TerrytoryInvalidMove(
          "cannot move territory to invalid index"
        );
      }

      const out: IResponseGeneric = {
        result: true,
      };

      if (territory.data.parent && territory.data.parent.id !== parentId) {
        territory.data.parent.id = parentId;
      } else {
        //  if the parent does not change -> remove the wanted child, so it can be added on specific position
        const currentIndex = childs.findIndex((ter) => ter.id === moveId);
        if (currentIndex === -1) {
          throw new TerrytoryInvalidMove(
            "cannot move territory- moveId not found in array of childs"
          );
        }
        if (currentIndex === newIndex) {
          out.result = false;
          out.errors = ["already on the new index"];
          return out;
        }
        childs.splice(currentIndex, 1);
      }

      childs = insertTerritoryToChilds(childs, newIndex, territory);

      for (let i = 0; i < childs.length; i++) {
        const child = childs[i];
        if (child.data.parent) {
          child.data.parent.order = i + 1;
        }
        await updateActant(request.db, child.id, child);
      }

      return out;
    })
  );
