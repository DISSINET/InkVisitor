import { asyncRouteHandler } from "../index";
import { Router } from "express";
import { IResponseStats } from "@shared/types";
import { ResponseStats } from "@models/stats/response";
import { IRequest } from "src/custom_typings/request";
import { IRequestStats } from "@shared/types/request-stats";

export default Router().post(
  "/",
  asyncRouteHandler<IResponseStats>(async (request: IRequest<unknown, IRequestStats>) => {
    const resp = new ResponseStats(request.body);

    await resp.prepare(request);

    return resp;
  })
);
