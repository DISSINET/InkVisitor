import { asyncRouteHandler } from "../index";
import { Router, Request } from "express";
import { findEntityById } from "@service/shorthands";
import { BadParams, AuditsDoNotExist } from "@shared/types/errors";
import { IResponseAudit, IStatement } from "@shared/types";
import { ResponseAudit } from "@models/audit/response";
import Statement from "@models/statement/statement";

export const getAuditByEntityId = asyncRouteHandler<IResponseAudit>(
  async (request: Request) => {
    console.log("wat");
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
    await response.getLastNForEntity(request.db.connection);
    if (response.last.length) {
      await response.getFirstForEntity(request.db.connection);
    }

    return response;
  }
);

export default Router().get(
  "/",
  asyncRouteHandler<IResponseAudit[]>(async (request: Request) => {
    const territoryId = (request.query.forTerritory as string) || "";
    if (!territoryId) {
      throw new BadParams("forTerritory has to be set");
    }

    const statements: IStatement[] = await Statement.findStatementsInTerritory(
      request.db.connection,
      territoryId
    );

    const out: IResponseAudit[] = [];
    for (const statementData of statements) {
      const response = new ResponseAudit(statementData.id);
      await response.getLastNForEntity(request.db.connection);
      if (response.last.length) {
        await response.getFirstForEntity(request.db.connection);
      }
      out.push(response);
    }

    return out;
  })
);
