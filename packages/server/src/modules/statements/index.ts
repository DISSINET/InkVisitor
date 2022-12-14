import { Router } from "express";
import { findEntityById } from "@service/shorthands";
import {
  BadParams,
  PermissionDeniedError,
  StatementDoesNotExits,
} from "@shared/types/errors";
import { asyncRouteHandler } from "..";
import { IResponseStatement, IStatement } from "@shared/types";
import Statement from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";
import { EntityEnums } from "@shared/enums";
import { IRequest } from "src/custom_typings/request";

export default Router()
  /**
   * @openapi
   * /statements/{statementId}/:
   *   get:
   *     description: Returns detail for statement-entity object
   *     tags:
   *       - entities
   *     parameters:
   *       - in: path
   *         name: statementId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the statement-entity entry
   *     responses:
   *       200:
   *         description: Returns a IResponseStatement object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseStatement"
   */
  .get(
    "/:statementId",
    asyncRouteHandler<IResponseStatement>(async (request: IRequest) => {
      const statementId = request.params.statementId;

      if (!statementId) {
        throw new BadParams("statement id has to be set");
      }

      const statementData = await findEntityById<IStatement>(
        request.db,
        statementId
      );

      if (!statementData || statementData.class !== EntityEnums.Class.Statement) {
        throw new StatementDoesNotExits(
          `statement ${statementId} was not found`,
          statementId
        );
      }

      const statementModel = new Statement({ ...statementData });

      if (!statementModel.canBeViewedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("statement cannot be accessed");
      }

      const response = new ResponseStatement(statementData);
      await response.prepare(request);

      return response;
    })
  );
