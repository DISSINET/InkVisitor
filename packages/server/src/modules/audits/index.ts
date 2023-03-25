import { asyncRouteHandler } from "../index";
import { Router } from "express";
import { findEntityById } from "@service/shorthands";
import { BadParams, AuditsDoNotExist } from "@shared/types/errors";
import { IResponseAudit } from "@shared/types";
import { ResponseAudit } from "@models/audit/response";
import { IRequest } from "src/custom_typings/request";

export const getAuditByEntityId = asyncRouteHandler<IResponseAudit>(
  async (request: IRequest) => {
    const entityId = request.params.entityId;

    if (!entityId) {
      throw new BadParams("entityId has to be set");
    }

    // entityId must be already in the db
    const existingEntity = await findEntityById(request.db, entityId);

    if (!existingEntity) {
      throw new AuditsDoNotExist(
        `cannot retrieve audits for entity ${entityId}`,
        entityId
      );
    }

    const response = new ResponseAudit(entityId);
    await response.prepare(request.db.connection);

    return response;
  }
);

export default Router()
