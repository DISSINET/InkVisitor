import { asyncRouteHandler } from "../index";
import { Router, Request } from "express";
import { findActantById } from "@service/shorthands";
import { BadParams, ActantDoesNotExits } from "@shared/types/errors";
import { IResponseAudit } from "@shared/types";
import { ResponseAudit } from "@models/audit/response";

export default Router().get(
  "/get/:actantId?",
  asyncRouteHandler<IResponseAudit>(async (request: Request) => {
    const actantId = request.params.actantId;

    if (!actantId) {
      throw new BadParams("actantId has to be set");
    }

    // actantId must be already in the db
    const existingActant = await findActantById(request.db, actantId);

    if (!existingActant) {
      throw new ActantDoesNotExits(
        `actant with id ${actantId} does not exist`,
        actantId
      );
    }

    const response = new ResponseAudit(actantId);
    await response.getLastNForActant(request.db.connection);
    await response.getFirstForActant(request.db.connection);

    return response;
  })
);
