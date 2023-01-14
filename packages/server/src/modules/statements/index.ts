import { Router } from "express";
import { findEntityById } from "@service/shorthands";
import {
  BadParams,
  InternalServerError,
  PermissionDeniedError,
  StatementDoesNotExits,
} from "@shared/types/errors";
import { asyncRouteHandler } from "..";
import { IResponseGeneric, IResponseStatement, IStatement } from "@shared/types";
import Statement from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";
import { EntityEnums } from "@shared/enums";
import { IRequest } from "src/custom_typings/request";
import { StatementObject } from "@shared/types/statement";
import { link } from "fs";

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
  )
  /**
   * @openapi
   * /statements/{statementId}/elementsOrders:
   *   put:
   *     description: Update statementOrder value in all statement objects according to provided input list of link ids
   *     tags:
   *       - entities
   *     parameters:
   *       - in: path
   *         name: statementId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the statement-entity entry
   *     requestBody:
   *       description: list of sorted ids
   *       content: 
   *         application/json:
   *           type: array 
   *           items:
   *             type: string
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .put(
    "/:statementId/elementsOrders",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const statementId = request.params.statementId;
      const linkIds = request.body as string[]; // list of linkIds
      if (linkIds.length === undefined) {
        throw new BadParams("list of ids must be provided");
      }

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

      const model = new Statement({ ...statementData });
      if (!model.canBeEditedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("entity cannot be saved");
      }

      // update indexes, or set to false if order value not provided
      model.walkObjects((object: StatementObject) => {
        const index = (linkIds || []).findIndex(linkId => linkId === object.id);

        if (index !== -1) {
          object.statementOrder = index;
        } else {
          object.statementOrder = false;
        }
      });

      await request.db.lock();

      // update only the required fields
      const result = await model.update(request.db.connection, { data: model.data, props: model.props });
      if (result.replaced || result.unchanged) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot update statement ${model.id}`);
      }
    })
  );
