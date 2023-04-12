import { Router } from "express";
import { findEntityById } from "@service/shorthands";
import {
  BadParams,
  InternalServerError,
  PermissionDeniedError,
  StatementDoesNotExits,
  TerritoryDoesNotExits,
} from "@shared/types/errors";
import { asyncRouteHandler } from "..";
import {
  IReference,
  IResponseGeneric,
  IResponseStatement,
  IStatement,
  ITerritory,
} from "@shared/types";
import Statement, { StatementTerritory } from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";
import { EntityEnums } from "@shared/enums";
import { IRequest } from "src/custom_typings/request";
import { StatementObject } from "@shared/types/statement";
import Audit from "@models/audit/audit";
import Entity from "@models/entity/entity";
import Reference from "@models/entity/reference";
import Relation from "@models/relation/relation";
import { getRelationClass } from "@models/factory";

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

      if (
        !statementData ||
        statementData.class !== EntityEnums.Class.Statement
      ) {
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
   *     description: Update statementOrder value in all statement objects according to provided input list of element ids
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
      const elementIds = request.body as string[]; // list of ids
      if (elementIds.length === undefined) {
        throw new BadParams("list of ids must be provided");
      }

      if (!statementId) {
        throw new BadParams("statement id has to be set");
      }

      const statementData = await findEntityById<IStatement>(
        request.db,
        statementId
      );

      if (
        !statementData ||
        statementData.class !== EntityEnums.Class.Statement
      ) {
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
        const index = (elementIds || []).findIndex(
          (elementId) => elementId === object.id
        );

        if (index !== -1) {
          object.statementOrder = index;
        } else {
          object.statementOrder = false;
        }
      });

      await request.db.lock();

      // update only the required fields
      const result = await model.update(request.db.connection, {
        data: model.data,
        props: model.props,
      });
      const newData = await findEntityById(request.db, model.id);
      if (!newData) {
        throw new InternalServerError(
          `cannot retrieve updated statement ${model.id}`
        );
      }

      if (result.replaced || result.unchanged) {
        await Audit.createNew(request, model.id, newData);

        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot update statement ${model.id}`);
      }
    })
  )
  /**
   * @openapi
   * /statements/batch-move:
   *   put:
   *     description: Move N statements under specific territory
   *     tags:
   *       - entities
   *     parameters:
   *       - in: query
   *         name: ids
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         required: true
   *         description: statements ids which should be moved
   *     requestBody:
   *       description: territory id to be used
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               territoryId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .put(
    "/batch-move",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      let statementsIds = request.query.ids;
      const newTerritoryId = request.body.territoryId;

      if (statementsIds && statementsIds.constructor.name == "String") {
        statementsIds = statementsIds.split(",");
      }
      if (!statementsIds || statementsIds.constructor.name !== "Array") {
        throw new BadParams("statement ids are required");
      }
      if (!newTerritoryId) {
        throw new BadParams("territory id is required");
      }

      await request.db.lock();

      const territory = await findEntityById<ITerritory>(
        request.db,
        newTerritoryId
      );
      if (!territory || territory.class !== EntityEnums.Class.Territory) {
        throw new TerritoryDoesNotExits(
          `territory ${newTerritoryId} was not found`,
          newTerritoryId
        );
      }

      const statements = await Entity.findEntitiesByIds(
        request.db.connection,
        statementsIds
      );
      const statementsCount = statements.reduce(
        (acc, cur) =>
          cur.class === EntityEnums.Class.Statement ? acc + 1 : acc,
        0
      );
      if (statementsCount !== statementsIds.length) {
        throw new StatementDoesNotExits("at least one statement not found", "");
      }

      for (const statementData of statements) {
        const model = new Statement({ ...(statementData as IStatement) });
        //update territory
        model.data.territory = new StatementTerritory({
          territoryId: newTerritoryId,
        });
        await model.update(request.db.connection, { data: model.data });
      }

      return {
        result: true,
        message: `${statementsCount} statements has been moved under '${territory.label}'`,
      };
    })
  )
  /**
   * @openapi
   * /statements/batch-copy:
   *   post:
   *     description: Copy N statements under new territory
   *     tags:
   *       - entities
   *     parameters:
   *       - in: query
   *         name: ids
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         required: true
   *         description: statements ids which should be copied
   *     requestBody:
   *       description: territory id to be used
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               territoryId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .post(
    "/batch-copy",
    asyncRouteHandler<IResponseGeneric>(async (req: IRequest) => {
      let statementsIds = req.query.ids;
      const newTerritoryId = req.body.territoryId;

      if (statementsIds && statementsIds.constructor.name == "String") {
        statementsIds = statementsIds.split(",");
      }
      if (!statementsIds || statementsIds.constructor.name !== "Array") {
        throw new BadParams("statement ids are required");
      }
      if (!newTerritoryId) {
        throw new BadParams("territory id is required");
      }

      await req.db.lock();

      const territory = await findEntityById<ITerritory>(
        req.db,
        newTerritoryId
      );
      if (!territory || territory.class !== EntityEnums.Class.Territory) {
        throw new TerritoryDoesNotExits(
          `territory ${newTerritoryId} was not found`,
          newTerritoryId
        );
      }

      const statements = await Entity.findEntitiesByIds(
        req.db.connection,
        statementsIds
      );
      const statementsCount = statements.reduce(
        (acc, cur) =>
          cur.class === EntityEnums.Class.Statement ? acc + 1 : acc,
        0
      );
      if (statementsCount !== statementsIds.length) {
        throw new StatementDoesNotExits("at least one statement not found", "");
      }

      const newIds: string[] = [];
      let relsErr = false;

      for (const stmtData of statements) {
        const model = new Statement({ ...(stmtData as IStatement) });
        //update territory
        model.data.territory = new StatementTerritory({
          territoryId: newTerritoryId,
        });
        // make sure the id will be created anew
        model.id = "";
        await model.save(req.db.connection);
        newIds.push(model.id);

        const origId = stmtData.id;
        const newId = model.id;

        const rels = (
          await Relation.getForEntity(req.db.connection, origId)
        ).map((r) => getRelationClass(r));
        relsErr =
          relsErr && (await Relation.copyMany(req, rels, origId, newId));
      }

      let msg = `${statementsCount} statements has been copied under '${territory.label}'`;
      if (relsErr) {
        msg += ", but without complete relations";
      }

      return {
        result: true,
        message: msg,
        data: newIds,
      };
    })
  )

  /**
   * @openapi
   * /statements/references:
   *   put:
   *     description: Handles batch update for statements references according to replace flag
   *     tags:
   *       - entities
   *     parameters:
   *       - in: query
   *         name: ids
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         required: true
   *         description: statements ids which should be processed
   *       - in: query
   *         name: replace
   *         schema:
   *           type: boolean
   *     requestBody:
   *       description: list of references to be applied
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               type: object:
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .put(
    "/references",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      let statementIds = request.query.ids;
      const replaceAction = !!request.query.replace;
      const referencesData = request.body as IReference[];

      if (statementIds && statementIds.constructor.name == "String") {
        statementIds = statementIds.split(",");
      }
      if (!statementIds || statementIds.constructor.name !== "Array") {
        throw new BadParams("statement ids are required");
      }

      if (
        referencesData.constructor.name != "Array" ||
        referencesData.map((r) => new Reference(r)).find((r) => !r.isValid())
      ) {
        throw new BadParams("bad references data");
      }

      await request.db.lock();

      const statements = await Entity.findEntitiesByIds(
        request.db.connection,
        statementIds
      );
      const statementsCount = statements.reduce(
        (acc, cur) =>
          cur.class === EntityEnums.Class.Statement ? acc + 1 : acc,
        0
      );
      if (statementsCount !== statementIds.length) {
        throw new StatementDoesNotExits("at least one statement not found", "");
      }

      if (replaceAction) {
        statements.forEach((s) => (s.references = referencesData));
      } else {
        statements.forEach((s) => {
          for (const refData of referencesData) {
            if (!s.references.find((stored) => stored.id === refData.id)) {
              s.references.push(refData);
            }
          }
        });
      }

      for (const statementData of statements) {
        const statement = new Statement(statementData as IStatement);
        await statement.update(request.db.connection, {
          references: statement.references,
        });
      }

      return {
        result: true,
        message: replaceAction ? "References replaced" : "References appended",
      };
    })
  );
