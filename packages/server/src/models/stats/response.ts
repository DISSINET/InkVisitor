import Audit from "@models/audit/audit";
import { IResponseUsersStats } from "@shared/types";
import { IRequest } from "src/custom_typings/request";

export class ResponseUsersStats implements IResponseUsersStats {
  byType: { [key: string]: number } = {};
  byEditor: { [key: string]: number } = {};
  byTime: { [key: string]: number } = {};

  async prepare(req: IRequest) {
    Audit.getByCreatedDate;
  }
}
