import Territory from "@models/territory/territory";
import User, { UserRight } from "@models/user/user";
import { Db } from "@service/RethinkDB";
import { getEntities } from "@service/shorthands";
import { EntityClass, UserRoleMode } from "@shared/enums";
import { IEntity, IResponseTree, IStatement, ITerritory } from "@shared/types";
import { TerritoriesBrokenError } from "@shared/types/errors";

export class TreeCreator {
  parentMap: Record<string, Territory[]>; // map of rootId -> childs
  statementsMap: Record<string, number>; // map of territoryId -> number of statements
  fullTree: IResponseTree | undefined;
  idMap: Record<string, IResponseTree>;

  constructor() {
    this.parentMap = {};
    this.statementsMap = {};
    this.idMap = {};
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

    // only one root possible
    if (this.parentMap[""]?.length != 1) {
      throw new TerritoriesBrokenError("Territories tree is broken");
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
      childs = this.parentMap[subtreeRootId].map((ter) => {
        const path = [];
        for (const parent of parents) {
          path.push(parent);
        }
        path.push(subtreeRootId);
        return this.populateTree(ter, lvl + 1, path);
      });
    }

    if (this.statementsMap[subtreeRootId]) {
      noOfStatements = this.statementsMap[subtreeRootId];
    }

    const childsAreEmpty = !childs.find((ch) => !ch.empty);

    this.idMap[subtreeRoot.id] = {
      territory: subtreeRoot,
      statementsCount: noOfStatements,
      lvl,
      children: childs,
      path: parents,
      empty: childsAreEmpty && !noOfStatements,
      right: UserRoleMode.Read,
    };

    this.fullTree = this.idMap[subtreeRoot.id];

    return this.fullTree;
  }

  applyPermissions(
    tree: IResponseTree | undefined,
    user: User
  ): IResponseTree | null {
    if (!tree) {
      return null;
    }

    const filtered: IResponseTree[] = [];
    for (const child of tree.children) {
      const filteredChild = this.applyPermissions(child, user);
      if (filteredChild) {
        filtered.push(filteredChild);
      }
    }

    if (
      tree.lvl > 0 &&
      filtered.length === 0 &&
      !(tree.territory as Territory).canBeViewedByUser(user)
    ) {
      return null;
    }

    return {
      ...tree,
      children: filtered,
      right: (tree.territory as Territory).getUserRoleMode(user),
    };
  }

  static sortTerritories(terA: ITerritory, terB: ITerritory): number {
    return (
      (terA.data.parent ? terA.data.parent.order : 0) -
      (terB.data.parent ? terB.data.parent.order : 0)
    );
  }

  static async countStatements(db: Db): Promise<Record<string, number>> {
    const statements = (
      await getEntities<IStatement>(db, { class: "S" })
    ).filter((s) => s.data.territory && s.data.territory.id);
    const statementsCountMap: Record<string, number> = {}; // key is territoryid
    for (const statement of statements) {
      if (statement.data.territory) {
        const terId = statement.data.territory.id;
        if (!statementsCountMap[terId]) {
          statementsCountMap[terId] = 0;
        }
        statementsCountMap[terId]++;
      }
    }

    return statementsCountMap;
  }
}

class TreeCache {
  tree: TreeCreator;

  constructor() {
    this.tree = new TreeCreator();
  }

  async initialize() {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    const newTree = new TreeCreator();

    const db = new Db();
    await db.initDb();

    const [territoriesData, statementsCountMap] = await Promise.all([
      getEntities<ITerritory>(db, {
        class: EntityClass.Territory,
      }),
      TreeCreator.countStatements(db),
    ]);

    const evr = getEntities<IEntity>(db, {});

    newTree.createParentMap(
      territoriesData
        .sort(TreeCreator.sortTerritories)
        .map((td) => new Territory({ ...td }))
    );
    newTree.statementsMap = statementsCountMap;

    newTree.populateTree(newTree.getRootTerritory(), 0, []);

    this.tree = newTree;
    console.log("[TreeCache.initialize]: done");
  }

  forUser(user: User): IResponseTree {
    const out = this.tree.applyPermissions(this.tree.fullTree, user);
    if (!out) {
      return {
        children: [],
        lvl: 0,
        path: [],
        right: UserRoleMode.Read,
        statementsCount: 0,
        territory: new Territory({}),
        empty: true,
      };
    }

    return out;
  }

  findRightInParentTerritory(
    terId: string,
    rights: UserRight[]
  ): UserRight | undefined {
    const ter = this.tree.idMap[terId];
    if (!ter) {
      return undefined;
    }

    // array of [T0, T1, T1-1, T1-1-3] etc, needs to be reversed to go from closest to farthest
    for (let i = ter.path.length - 1; i >= 0; i--) {
      const parentId = ter.path[i];
      for (const right of rights) {
        if (right.territory === parentId) {
          // this is automatically closest match
          return right;
        }
      }
    }

    // sadly, no right found upwards (towards the T0)
    return undefined;
  }

  findRightInChildTerritory(
    terId: string,
    rights: UserRight[]
  ): UserRight | undefined {
    const ter = this.tree.idMap[terId];
    if (!ter) {
      return undefined;
    }

    for (const right of rights) {
      if (right.territory === terId) {
        // this is automatically the closest match
        return right;
      }

      // go deeper for each child
      for (const child of ter.children) {
        const rightInChild = this.findRightInChildTerritory(
          child.territory.id,
          rights
        );
        if (rightInChild) {
          return rightInChild;
        }
      }
    }

    // sadly, no right found upwards (towards the T0)
    return undefined;
  }

  getRightForTerritory(
    terId: string,
    rights: UserRight[]
  ): UserRight | undefined {
    const exactRight = rights.find((r) => r.territory === terId);
    if (exactRight) {
      return exactRight;
    }

    let derivedRight = this.findRightInParentTerritory(terId, rights);
    if (derivedRight) {
      return derivedRight;
    }

    derivedRight = this.findRightInChildTerritory(terId, rights);
    if (derivedRight) {
      return derivedRight;
    }

    return undefined;
  }
}

const treeCache: TreeCache = new TreeCache();
export default treeCache;

export async function prepareTreeCache() {
  await treeCache.initialize();
}
