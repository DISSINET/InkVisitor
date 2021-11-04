import { getActants } from "@service/shorthands";
import { TerritoriesBrokenError } from "@shared/types/errors";
import { IResponseTree, IStatement, ITerritory } from "@shared/types";
import { Db } from "@service/RethinkDB";
import Territory from "@models/territory";
import { ActantType, UserRoleMode } from "@shared/enums";
import User from "@models/user";

export class TreeCreator {
  parentMap: Record<string, Territory[]>; // map of rootId -> childs
  statementsMap: Record<string, number>; // map of territoryId -> number of statements
  fullTree: IResponseTree;

  constructor() {
    this.parentMap = {};
    this.statementsMap = {};
    this.fullTree = {
      children: [],
      lvl: 0,
      path: [],
      right: UserRoleMode.Read,
      statementsCount: 0,
      territory: new Territory({}),
      empty: true,
    };
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
      childs = this.parentMap[subtreeRootId].map((ter) =>
        this.populateTree(ter, lvl + 1, [...parents, subtreeRootId])
      );
    }

    if (this.statementsMap[subtreeRootId]) {
      noOfStatements = this.statementsMap[subtreeRootId];
    }

    const childsAreEmpty = !childs.find((ch) => !ch.empty);

    this.fullTree = {
      territory: subtreeRoot,
      statementsCount: noOfStatements,
      lvl,
      children: childs,
      path: parents,
      empty: childsAreEmpty && !noOfStatements,
      right: UserRoleMode.Read,
    };

    return this.fullTree;
  }

  applyPermissions(tree: IResponseTree, user: User): IResponseTree | null {
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
      await getActants<IStatement>(db, { class: "S" })
    ).filter((s) => s.data.territory && s.data.territory.id);
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
}

class TreeCache {
  tree: TreeCreator;

  constructor() {
    this.tree = new TreeCreator();
  }

  async initialize() {
    const db = new Db();
    await db.initDb();

    const [territoriesData, statementsCountMap] = await Promise.all([
      getActants<ITerritory>(db, {
        class: ActantType.Territory,
      }),
      TreeCreator.countStatements(db),
    ]);

    this.tree.createParentMap(
      territoriesData
        .sort(TreeCreator.sortTerritories)
        .map((td) => new Territory({ ...td }))
    );
    this.tree.statementsMap = statementsCountMap;

    this.tree.populateTree(this.tree.getRootTerritory(), 0, []);
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
}

const treeCache: TreeCache = new TreeCache();
export default treeCache;

export async function prepareTreeCache() {
  await treeCache.initialize();
  console.log("[tree cache]: prepared");
}
