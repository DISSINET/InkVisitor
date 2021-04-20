import { asyncRouteHandler } from "../index";
import { Router, Request } from "express";
import {
  findActantById,
  findActantsByLabelOrClass,
  createActant,
  updateActant,
  deleteActant,
  getActantUsage,
} from "@service/shorthands";
import { BadParams, ActantDoesNotExits } from "@common/errors";
import { IActant, IResponseDetail, IResponseGeneric } from "@shared/types";

export default Router()
  .get(
    "/get/:actantId?",
    asyncRouteHandler<IActant>(async (request: Request) => {
      const actantId = request.params.actantId;

      if (!actantId) {
        throw new BadParams("actantId has to be set");
      }

      const actant = await findActantById<IActant>(
        request.db,
        actantId as string
      );
      if (!actant) {
        throw new ActantDoesNotExits(`actant ${actantId} was not found`);
      }

      return actant;
    })
  )
  .post(
    "/getMore",
    asyncRouteHandler<IActant[]>(async (request: Request) => {
      const label = request.body.label;
      const classParam = request.body.class;

      if (!label && !classParam) {
        throw new BadParams("label or class has to be set");
      }

      return await findActantsByLabelOrClass(request.db, label, classParam);
    })
  )
  .post(
    "/create",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const actantData = request.body as IActant;

      if (
        !actantData ||
        !actantData.class ||
        //  !actantData.label ||
        !actantData.data
      ) {
        throw new BadParams("actant data have to be set");
      }

      const result = await createActant(request.db, actantData, true);

      if (result.inserted === 1) {
        return {
          result: true,
        };
      } else {
        return {
          result: false,
          errors: result.first_error ? [result.first_error] : [],
        };
      }
    })
  )
  .put(
    "/update/:actantId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const actantId = request.params.actantId;
      const actantData = request.body as IActant;

      if (!actantId || !actantData || Object.keys(actantData).length === 0) {
        throw new BadParams("actant id and data have to be set");
      }

      const allowedKeys = ["class", "labels", "data"];
      for (const key of Object.keys(actantData)) {
        if (allowedKeys.indexOf(key) === -1) {
          throw new BadParams("actant data have unsupported keys");
        }
      }

      const result = await updateActant(request.db, actantId, actantData);

      if (result.replaced) {
        return {
          result: true,
        };
      } else {
        return {
          result: false,
          errors: result.first_error ? [result.first_error] : [],
        };
      }
    })
  )
  .delete(
    "/delete/:actantId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const actantId = request.params.actantId;

      if (!actantId) {
        throw new BadParams("actant id has to be set");
      }

      const result = await deleteActant(request.db, actantId);

      if (result.deleted === 1) {
        return {
          result: true,
        };
      } else {
        return {
          result: false,
          errors: result.first_error ? [result.first_error] : [],
        };
      }
    })
  )
  .get(
    "/detail/:actantId?",
    asyncRouteHandler<IResponseDetail>(async (request: Request) => {
      const actantId = request.params.actantId;

      if (!actantId) {
        throw new BadParams("actant id has to be set");
      }

      const actant = await findActantById<IActant>(request.db, actantId);
      if (!actant) {
        throw new ActantDoesNotExits(`actant ${actantId} was not found`);
      }

      const usage = await getActantUsage(request.db, actantId);

      return {
        ...actant,
        usedCount: usage,
      };
    })
  );
