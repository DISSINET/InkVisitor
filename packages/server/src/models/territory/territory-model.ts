import { ITerritory } from "@inkvisitor/shared/types";
import { Connection } from "rethinkdb-ts";

export interface ITerritoryModel extends ITerritory {
  findChilds(
    db: Connection | undefined,
    isDeep?: boolean
  ): Promise<Record<number | string, ITerritory>>;
}
