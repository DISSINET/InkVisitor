import { Router, Request } from "express";
import { IAction, IResponseGeneric } from "@shared/types";
import {
  findAllActions,
  findActionById,
  findActionsByLabel,
  createAction,
  updateAction,
  deleteAction,
} from "@service/shorthands";
import { BadParams, ActionDoesNotExits } from "@shared/types/errors";
import { asyncRouteHandler } from "..";

export default Router()
  .get(
    "/get/:actionId?",
    asyncRouteHandler<IAction>(async (request: Request) => {
      const actionId = request.params.actionId;

      if (!actionId) {
        throw new BadParams("action has to be set");
      }

      const action = await findActionById(request.db, actionId);
      if (!action) {
        throw new ActionDoesNotExits(`action ${actionId} was not found`);
      }

      return action;
    })
  )
  .post(
    "/getMore",
    asyncRouteHandler<IAction[]>(async (request: Request) => {
      const label = request.body.label;

      if (!label) {
        return await findAllActions(request.db);
      }

      return await findActionsByLabel(request.db, label);
    })
  )
  .post(
    "/create",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
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
    "/update/:actionId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const actionId = request.params.actionId;
      const actionData = request.body as IAction;

      if (!actionId || !actionData || !Object.keys(actionData).length) {
        throw new BadParams("action id and data have to be set");
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

      const result = await updateAction(request.db, actionId, actionData);

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
    "/delete/:actionId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const actionId = request.params.actionId;

      if (!actionId) {
        throw new BadParams("action id has to be set");
      }

      const result = await deleteAction(request.db, actionId);

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
  );
