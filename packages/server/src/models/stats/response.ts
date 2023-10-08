import Audit from "@models/audit/audit";
import Entity from "@models/entity/entity";
import { IResponseUsersStats } from "@shared/types";
import { IResponseEntitiesStats } from "@shared/types/response-stats";
import { IRequest } from "src/custom_typings/request";

export class ResponseUsersStats implements IResponseUsersStats {
  byType: { [key: string]: number } = {};
  byEditor: { [key: string]: number } = {};
  byTime: { [key: string]: number } = {};

  async prepare(req: IRequest) {}
}

export class ResponseEntitiesStats implements IResponseEntitiesStats {
  byTime: { [key: string]: number } = {};

  async prepareLastWeekStats(req: IRequest) {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const mappedByTime = await Entity.getGroupedByDate(
      req.db.connection,
      now,
      sevenDaysAgo
    );

    for (const date of Object.keys(mappedByTime)) {
      this.byTime[date] = mappedByTime[date].length;
    }
  }

  async prepare(req: IRequest) {
    await this.prepareLastWeekStats(req);
  }
}
