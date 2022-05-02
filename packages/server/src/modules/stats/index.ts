import { asyncRouteHandler } from "../index";
import { Router, Request } from "express";
import { IResponseStats } from "@shared/types";
import { ResponseStats } from "@models/stats/response";

export default Router().get(
  "/",
  asyncRouteHandler<IResponseStats>(async (request: Request) => {
    const resp = new ResponseStats();

    await resp.prepare(request);

    return resp;
  })
);
