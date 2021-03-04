import { Request, Response } from "express";
import { Router } from "express";
import { getActants } from "@service/shorthands";
import { BadParams, TerritoriesBrokenError } from "@common/errors";
import { asyncRouteHandler } from "..";
import { IResponseTree, ITerritory } from "@shared/types";

function populateTree(
  root: ITerritory,
  parentMap: Record<string, ITerritory[]>
): IResponseTree {
  const childs = parentMap[root.id]
    ? parentMap[root.id].map((ter) => populateTree(ter, parentMap))
    : [];
  return {
    territory: root,
    statementsCount: 0, // for now
    maxLevels: childs.length
      ? Math.max(...childs.map((child) => child.maxLevels)) + 1
      : 0,
    children: childs,
  };
}

export default Router().get(
  "/get",
  asyncRouteHandler(async (request: Request, response: Response) => {
    const territories = await getActants<ITerritory>(request.db, {
      class: "T",
    });

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

    response.json(populateTree(root, parentMap));
  })
);
