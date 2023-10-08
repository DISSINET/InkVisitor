import { asyncRouteHandler } from "../index";
import { Router } from "express";
import { IResponseUsersStats } from "@shared/types";
import {
  ResponseEntitiesStats,
  ResponseUsersStats,
} from "@models/stats/response";
import { IRequest } from "src/custom_typings/request";
import { IResponseEntitiesStats } from "@shared/types/response-stats";

export default Router()
  .get(
    "/users",
    asyncRouteHandler<IResponseUsersStats>(async (request: IRequest) => {
      const resp = new ResponseUsersStats();

      await resp.prepare(request);

      return resp;
    })
  )
  .get(
    "/entities",
    asyncRouteHandler<IResponseEntitiesStats>(async (request: IRequest) => {
      const resp = new ResponseEntitiesStats();

      await resp.prepare(request);

      return resp;
    })
  );
