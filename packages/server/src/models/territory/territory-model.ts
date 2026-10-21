import { ITerritory } from "@inkvisitor/shared/types";
import { Conn } from "@service/storage";

export interface ITerritoryModel extends ITerritory {
  findChilds(
    db: Conn | undefined,
    isDeep?: boolean
  ): Promise<Record<number | string, ITerritory>>;
}
