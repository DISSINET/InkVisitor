import { IResponseGeneric } from "@shared/types";
import { Router } from "express";
import { asyncRouteHandler } from "../index";
import { IRequest } from "src/custom_typings/request";
import pythonClient from "@service/pythonapi";

export default Router()
  /**
   * @openapi
   * /pythondata/{path}:
   *   get:
   *     description: Returns example data from python api
   *     tags:
   *       - pythondata
   *     responses:
   *       200:
   *         description: Returns IResponseGeneric object for python api data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .get(
    "/:path",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      try {
        const res = await pythonClient.test();
        return {
          result: true,
          data: res,
        };
      } catch (e) {
        return {
          result: false,
          error: "InternalServerError",
          message: e?.toString()
        };
      }
    })
  );
