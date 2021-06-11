import { Router, Request } from "express";
import {
  findActantById,
  getActants,
  getTerritoryChilds,
} from "@service/shorthands";
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

class TreeCreator {
  parentMap: Record<string, ITerritory[]>; // map of rootId -> childs
  statementsMap: Record<string, number>; // map of territoryId -> number of statements

  constructor(
    territories: ITerritory[],
    statementsMap: Record<string, number>
  ) {
    this.parentMap = {};
    this.createParentMap(territories);

    // only one root possible
    if (this.parentMap[""]?.length != 1) {
      throw new TerritoriesBrokenError("Territories tree is broken");
    }

    this.statementsMap = statementsMap;
  }

  getRootTerritory(): ITerritory {
    return this.parentMap[""][0];
  }

  createParentMap(territories: ITerritory[]) {
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
    subtreeRoot: ITerritory,
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
      const territories = (
        await getActants<ITerritory>(request.db, {
          class: "T",
        })
      ).sort(sortTerritories);

      const statementsCountMap = await countStatements(request.db);
      const helper = new TreeCreator(territories, statementsCountMap);

      return helper.populateTree(helper.getRootTerritory(), 0, []);
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

      if (!territory.data.parent) {
        // root territory cannot be moved - or not yet implemented
        throw new TerrytoryInvalidMove("cannot move root territory");
      } else if (territory.data.parent.id !== parentId) {
        // change parent of the terri
        territory.data.parent.id = parentId;
      } else {
        // if the parent does not change -> remove the wanted child, so it can be added on specific position
        // this is not required if moving under new parent
        const currentIndex = childs.findIndex((ter) => ter.id === moveId);
        if (currentIndex === -1) {
          throw new TerrytoryInvalidMove("territory not found in the array");
        }
        if (currentIndex === newIndex) {
          throw new TerrytoryInvalidMove("already on the position");
        }
        childs.splice(currentIndex, 1);
      }

      childs = insertTerritoryToChilds(childs, newIndex, territory);

      for (let i = 0; i < childs.length; i++) {
        const childTerritory = new Territory({ ...childs[i] });
        if (childTerritory.data.parent) {
          childTerritory.data.parent.order = i + 1;
          await childTerritory.update(request.db.connection, {
            data: childTerritory.data,
          });
        }
      }

      return out;
    })
  );
