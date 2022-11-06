import { IResponseStats } from "@shared/types";
import { IRequest } from "src/custom_typings/request";

export class ResponseStats implements IResponseStats {
  byType: { [key: string]: number } = {};
  byEditor: { [key: string]: number } = {};
  byTime: { [key: string]: number } = {};

  async prepare(req: IRequest) { }
}
