import { asyncRouteHandler } from "../index";
import { Router } from "express";
import { IResponseUsersStats } from "@shared/types";
import { ResponseUsersStats } from "@models/stats/response";
import { IRequest } from "src/custom_typings/request";

export default Router().get(
  "/users",
  asyncRouteHandler<IResponseUsersStats>(async (request: IRequest) => {
    const resp = new ResponseUsersStats();

    await resp.prepare(request);

    return resp;
  })
);
