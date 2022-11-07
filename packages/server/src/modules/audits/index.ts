import { asyncRouteHandler } from "../index";
import { Router } from "express";
import { findEntityById } from "@service/shorthands";
import { BadParams, AuditsDoNotExist } from "@shared/types/errors";
import { IResponseAudit, IStatement } from "@shared/types";
import { ResponseAudit } from "@models/audit/response";
import Statement from "@models/statement/statement";
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
    await response.getLastNForEntity(request.db.connection);
    if (response.last.length) {
      await response.getFirstForEntity(request.db.connection);
    }

    return response;
  }
);

export default Router()
  /**
   * @openapi
   * /audits/:
   *   get:
   *     description: Delete an acl entry
   *     tags:
   *       - audits
   *     parameters:
   *       - in: query
   *         name: forTerritory
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of territory for which we want to find statements with audit entries        
   *     responses:
   *       200:
   *         description: Returns list of IResponseAudit entries
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/IResponseAudit"
   */
  .get(
    "/",
    asyncRouteHandler<IResponseAudit[]>(async (request: IRequest) => {
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
