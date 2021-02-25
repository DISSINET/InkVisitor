import { NextFunction, raw, Request, Response } from "express";
import { Router } from "express";
import { IAction } from "@shared/types";
import { findActionById } from "@service/shorthands";
import {
  BadCredentialsError,
  BadParams,
  ActionDoesNotExits,
} from "@common/errors";
import { asyncRouteHandler } from "..";

export default Router().get(
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
);
