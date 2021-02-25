import { NextFunction, raw, Request, Response } from "express";
import { Router } from "express";
import { IAction } from "@shared/types";
import {
  findActionById,
  findActionsByLabel,
  createAction,
} from "@service/shorthands";
import {
  BadCredentialsError,
  BadParams,
  ActionDoesNotExits,
} from "@common/errors";
import { asyncRouteHandler } from "..";

export default Router()
  .get(
    "/get/:actionId?",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const actionId = request.params.actionId;

      if (!actionId) {
        throw new BadParams("action has to be set");
      }

      const action = await findActionById(request.db, actionId);
      if (!action) {
        throw new ActionDoesNotExits(`action ${actionId} was not found`);
      }

      response.json(action);
    })
  )
  .post(
    "/getMore",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const label = request.body.label;

      if (!label) {
        throw new BadParams("label has to be set");
      }

      const actions = await findActionsByLabel(request.db, label);

      response.json(actions);
    })
  )
  .post(
    "/create",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const actionData = request.body as IAction;

      if (!actionData || !Object.keys(actionData).length) {
        throw new BadParams("action data have to be set");
      }

      const allowedKeys = [
        "id",
        "parent",
        "note",
        "labels",
        "types",
        "valencies",
        "rulesActants",
        "rulesProperties",
      ];
      for (const key of Object.keys(actionData)) {
        if (allowedKeys.indexOf(key) === -1) {
          throw new BadParams("actant data have unsupported keys");
        }
      }

      const result = await createAction(request.db, actionData);

      if (result.inserted === 1) {
        response.json({
          success: true,
        });
      } else {
        response.json({
          success: false,
          errors: result.errors,
        });
      }
    })
  );
