import { asyncRouteHandler } from "../index";
import { Router } from "express";
import { IResponseStats } from "@shared/types";
import { ResponseStats } from "@models/stats/response";
import { IRequest } from "src/custom_typings/request";

export default Router().get(
  "/",
  asyncRouteHandler<IResponseStats>(async (request: IRequest) => {
    const resp = new ResponseStats();

    await resp.prepare(request);

    return resp;
  })
);
