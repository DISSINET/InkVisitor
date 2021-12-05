import { asyncRouteHandler } from "../index";
import { Router, Request } from "express";
import { findActantById } from "@service/shorthands";
import { BadParams, ActantDoesNotExits } from "@shared/types/errors";
import { IResponseAudit } from "@shared/types";
import Audit from "@models/audit";

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

    const out: IResponseAudit = {
      actant: actantId,
      last: await Audit.getLastNForActant(request.db.connection, actantId),
    };

    const first = await Audit.getFirstForActant(
      request.db.connection,
      actantId
    );
    if (first) {
      out.first = first;
    }

    return out;
  })
);
