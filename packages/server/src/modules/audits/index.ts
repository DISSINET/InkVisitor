import { asyncRouteHandler } from "../index";
import { Router, Request } from "express";
import { findActantById } from "@service/shorthands";
import { BadParams, ActantDoesNotExits } from "@shared/types/errors";
import { IResponseAudit } from "@shared/types";
import { ResponseAudit } from "@models/audit/response";

export default Router().get(
  "/get/:entityId?",
  asyncRouteHandler<IResponseAudit>(async (request: Request) => {
    const entityId = request.params.entityId;

    if (!entityId) {
      throw new BadParams("entityId has to be set");
    }

    // actantId must be already in the db
    const existingActant = await findActantById(request.db, entityId);

    if (!existingActant) {
      throw new ActantDoesNotExits(
        `entity with id ${entityId} does not exist`,
        entityId
      );
    }

    const response = new ResponseAudit(entityId);
    await response.getLastNForEntity(request.db.connection);
    await response.getFirstForEntity(request.db.connection);

    return response;
  })
);
