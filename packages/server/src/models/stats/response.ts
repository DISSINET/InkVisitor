import { IResponseStats } from "@shared/types";
import { Request } from "express";

export class ResponseStats implements IResponseStats {
  byType: { [key: string]: number } = {};
  byEditor: { [key: string]: number } = {};
  byTime: { [key: string]: number } = {};

  async prepare(req: Request) {}
}
