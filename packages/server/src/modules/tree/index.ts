import { Router, Request } from "express";
import { findActantById, getActants } from "@service/shorthands";
import {
  BadParams,
  TerritoriesBrokenError,
  TerritoryDoesNotExits,
  TerrytoryInvalidMove,
} from "@shared/types/errors";
import { asyncRouteHandler } from "..";
import {
  IResponseGeneric,
  IResponseTree,
  IStatement,
  ITerritory,
} from "@shared/types";
import { Db } from "@service/RethinkDB";
import Territory from "@models/territory";
import { IParentTerritory } from "@shared/types/territory";
import { ActantType } from "@shared/enums";

class TreeCreator {
  parentMap: Record<string, Territory[]>; // map of rootId -> childs
  statementsMap: Record<string, number>; // map of territoryId -> number of statements

  constructor(territories: Territory[], statementsMap: Record<string, number>) {
    this.parentMap = {};
    this.createParentMap(territories);

    // only one root possible
    if (this.parentMap[""]?.length != 1) {
      throw new TerritoriesBrokenError("Territories tree is broken");
    }

    this.statementsMap = statementsMap;
  }

  getRootTerritory(): Territory {
    return this.parentMap[""][0];
  }

  createParentMap(territories: Territory[]) {
    for (const territory of territories) {
      if (typeof territory.data.parent === "undefined") {
        continue;
      }

      const parentId: string = territory.data.parent
        ? territory.data.parent.id
        : "";
      if (!this.parentMap[parentId]) {
        this.parentMap[parentId] = [];
      }
      this.parentMap[parentId].push(territory);
    }
  }

  populateTree(
    subtreeRoot: Territory,
    lvl: number,
    parents: string[]
  ): IResponseTree {
    const subtreeRootId = subtreeRoot.id;
    let childs: IResponseTree[] = [];
    let noOfStatements = 0;

    if (this.parentMap[subtreeRootId]) {
      childs = this.parentMap[subtreeRootId].map((ter) =>
        this.populateTree(ter, lvl + 1, [...parents, subtreeRootId])
      );
    }

    if (this.statementsMap[subtreeRootId]) {
      noOfStatements = this.statementsMap[subtreeRootId];
    }

    const childsAreEmpty = !childs.find((ch) => !ch.empty);

    return {
      territory: subtreeRoot,
      statementsCount: noOfStatements,
      lvl,
      children: childs,
      path: parents,
      empty: childsAreEmpty && !noOfStatements,
    };
  }
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

async function countStatements(db: Db): Promise<Record<string, number>> {
  const statements = (await getActants<IStatement>(db, { class: "S" })).filter(
    (s) => s.data.territory && s.data.territory.id
  );
  const statementsCountMap: Record<string, number> = {}; // key is territoryid
  for (const statement of statements) {
    const terId = statement.data.territory.id;
    if (!statementsCountMap[terId]) {
      statementsCountMap[terId] = 0;
    }

    statementsCountMap[terId]++;
  }

  return statementsCountMap;
}

export default Router()
  .get(
    "/get",
    asyncRouteHandler<IResponseTree>(async (request: Request) => {
      const [territoriesData, statementsCountMap] = await Promise.all([
        getActants<ITerritory>(request.db, {
          class: "T",
        }),
        countStatements(request.db),
      ]);

      const territories = territoriesData
        .sort(sortTerritories)
        .map((td) => new Territory({ ...td }));

      const helper = new TreeCreator(territories, statementsCountMap);

      const tree = helper.populateTree(helper.getRootTerritory(), 0, []);

      (tree.territory as Territory).canBeViewedBy(request.getUserOrFail());
      return tree;
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
        class: ActantType.Territory,
      });
      if (!territory) {
        throw new TerritoryDoesNotExits(
          `territory ${moveId} does not exist`,
          moveId
        );
      }

      const parent = await findActantById<ITerritory>(request.db, parentId, {
        class: ActantType.Territory,
      });
      if (!parent) {
        throw new TerritoryDoesNotExits(
          `parent territory ${parentId} does not exist`,
          parentId
        );
      }

      const childsMap = await new Territory({ ...parent }).findChilds(
        request.db.connection
      );
      const childsArray = Object.values(childsMap).sort(sortTerritories);

      if (newIndex < 0 || newIndex > childsArray.length) {
        throw new TerrytoryInvalidMove(
          "cannot move territory to invalid index"
        );
      }

      const out: IResponseGeneric = {
        result: true,
      };

      if (!territory.data.parent) {
        // root territory cannot be moved - or not yet implemented
        throw new TerrytoryInvalidMove("cannot move root territory");
      } else if (territory.data.parent.id !== parentId) {
        // change parent of the territory
        territory.data.parent.id = parentId;
        territory.data.parent.order = -1;
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

        territory.data.parent.order = newOrderValue;
      }

      const childTerritory = new Territory({ ...territory });
      childTerritory.setSiblings(childsMap);
      await childTerritory.update(request.db.connection, {
        data: childTerritory.data,
      });

      return out;
    })
  );
