import { asyncRouteHandler } from "../index";
import { Router } from "express";
import { findEntityById } from "@service/shorthands";
import {
  BadParams,
  AuditsDoNotExist,
  AuditDoesNotExist,
} from "@shared/types/errors";
import { IAudit, IResponseAudit, IResponseGeneric } from "@shared/types";
import { ResponseAudit } from "@models/audit/response";
import { IRequest } from "src/custom_typings/request";
import Audit from "@models/audit/audit";

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

export default Router().get(
  "/",
  asyncRouteHandler<IResponseGeneric<IAudit>>(
    async (
      request: IRequest<
        unknown,
        unknown,
        { skip: number; take: number; from: string }
      >
    ) => {
      const firstAudits = await Audit.findMany(request.db.connection, {
        skip: request.query.skip || 0,
        take: request.query.take || 1,
        from: new Date(request.query.from || "1970"),
      });

      if (!firstAudits || !firstAudits.length) {
        throw new AuditDoesNotExist("no audit found");
      }

      return {
        result: true,
        data: firstAudits[0],
      };
    }
  )
);
