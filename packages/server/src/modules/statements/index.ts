import { Router } from "express";
import { r as rethink, RDatum } from "rethinkdb-ts";
import { entityCacheKey, findEntityById } from "@service/shorthands";
import treeCache from "@service/treeCache";
import { cache } from "@service/ttlCache";
import {
  BadParams,
  PermissionDeniedError,
  StatementDoesNotExits,
  TerritoryDoesNotExits,
} from "@inkvisitor/shared/types/errors";
import { asyncRouteHandler } from "..";
import {
  IReference,
  IResponseGeneric,
  IResponseStatement,
  IStatement,
  ITerritory,
} from "@inkvisitor/shared/types";
import Statement, { StatementTerritory } from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IRequest } from "src/custom_typings/request";
import Entity from "@models/entity/entity";
import Reference from "@models/entity/reference";
import Relation from "@models/relation/relation";
import Territory from "@models/territory/territory";
import { getEntityClass, getRelationClass } from "@models/factory";

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

      // canBeViewedByUser is intentionally not enforced here: the Explorer
      // surfaces statements from all territories and the detail box must be
      // able to read them. Mutation rights are still controlled via
      // statement.right in the response (write/admin vs read-only).

      const response = new ResponseStatement(statementData);
      await response.prepare(request);

      return response;
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

      const user = request.getUserOrFail();

      // target territory must be editable by the acting user
      const targetModel = getEntityClass(territory) as Territory;
      if (!targetModel.canBeEditedByUser(user)) {
        throw new PermissionDeniedError(
          `cannot move statements into territory ${newTerritoryId}`
        );
      }

      // every moved statement must be editable in its current (source) territory
      for (const statementData of statements) {
        if (statementData.class !== EntityEnums.Class.Statement) {
          continue;
        }
        const stmtModel = new Statement({ ...(statementData as IStatement) });
        if (!stmtModel.canBeEditedByUser(user)) {
          throw new PermissionDeniedError(
            `cannot move statement ${statementData.id} from its territory`
          );
        }
      }

      // Get existing statements in target territory to determine the last order
      const existingStatements = await Statement.findStatementsInTerritory(
        request.db.connection,
        newTerritoryId
      );
      const lastOrder =
        existingStatements.length > 0
          ? Math.max(
              ...existingStatements.map((s) => s.data.territory?.order || 0)
            )
          : 0;

      // Sort statements by their current order to preserve relative ordering
      const sortedStatements = statements
        .filter((s) => s.class === EntityEnums.Class.Statement)
        .sort(
          (a, b) =>
            (a.data.territory?.order || 0) - (b.data.territory?.order || 0)
        );

      // Move statements while preserving their relative order
      for (let i = 0; i < sortedStatements.length; i++) {
        const statementData = sortedStatements[i];
        const model = new Statement({ ...(statementData as IStatement) });
        model.data.territory = new StatementTerritory({
          territoryId: newTerritoryId,
          order: lastOrder + i + 1,
        });
        await model.update(request.db.connection, {
          data: model.data,
        }, true);
      }

      await treeCache.initialize();

      return {
        result: true,
        message: `${statementsCount} statements has been moved under '${territory.labels[0]}'`,
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

      // The copies land in the target, so that is what has to be writable. The
      // sources are only read - being able to see a statement is enough to take
      // a copy of it into a territory of one's own.
      if (
        !new Territory({ ...territory }).canBeEditedByUser(req.getUserOrFail())
      ) {
        throw new PermissionDeniedError(
          `cannot copy statements into territory ${newTerritoryId}`
        );
      }

      // Get existing statements in target territory to determine the last order
      const existingStatements = await Statement.findStatementsInTerritory(
        req.db.connection,
        newTerritoryId
      );
      const lastOrder =
        existingStatements.length > 0
          ? Math.max(
              ...existingStatements.map((s) => s.data.territory?.order || 0)
            )
          : 0;

      // Sort statements by their current order to preserve relative ordering
      const sortedStatements = statements
        .filter((s) => s.class === EntityEnums.Class.Statement)
        .sort(
          (a, b) =>
            (a.data.territory?.order || 0) - (b.data.territory?.order || 0)
        );

      const newIds: string[] = [];
      let relsErr = false;

      // Copy statements while preserving their relative order
      for (let i = 0; i < sortedStatements.length; i++) {
        const stmtData = sortedStatements[i];
        const model = new Statement({ ...(stmtData as IStatement) });

        //update territory with new order
        model.data.territory = new StatementTerritory({
          territoryId: newTerritoryId,
          order: lastOrder + i + 1,
        });

        model.resetIds();

        // Skip the per-statement tree rebuild; we rebuild once after the loop.
        await model.save(req.db.connection, true);
        newIds.push(model.id);

        const origId = stmtData.id;
        const newId = model.id;

        const rels = (
          await Relation.findForEntities(req.db.connection, [origId])
        ).map((r) => getRelationClass(r));
        if (
          (await Relation.copyMany(req, rels, origId, newId)) !== rels.length
        ) {
          relsErr = true;
        }
      }

      // One rebuild for the whole batch instead of N (one per saved statement).
      await treeCache.initialize();

      let msg = `${statementsCount} statements have been copied under '${territory.labels[0]}'`;
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
   * /statements/batch-reorder:
   *   put:
   *     description: Reorder N statements by setting exact territory order values
   *     tags:
   *       - entities
   *     requestBody:
   *       description: list of statement ids with target order
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               updates:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     order:
   *                       type: number
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .put(
    "/batch-reorder",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const updates = request.body?.updates as
        | { id: string; order: number }[]
        | undefined;

      if (!updates || updates.constructor.name !== "Array" || !updates.length) {
        throw new BadParams("updates are required");
      }

      if (
        updates.some(
          (item) =>
            !item ||
            typeof item.id !== "string" ||
            item.id.length === 0 ||
            typeof item.order !== "number" ||
            Number.isNaN(item.order)
        )
      ) {
        throw new BadParams("invalid updates payload");
      }

      const uniqueIds = Array.from(new Set(updates.map((item) => item.id)));
      if (uniqueIds.length !== updates.length) {
        throw new BadParams("duplicate statement ids are not allowed");
      }

      await request.db.lock();

      const statements = await Entity.findEntitiesByIds(request.db.connection, uniqueIds);
      const statementsCount = statements.reduce(
        (acc, cur) => (cur.class === EntityEnums.Class.Statement ? acc + 1 : acc),
        0
      );
      if (statementsCount !== uniqueIds.length) {
        throw new StatementDoesNotExits("at least one statement not found", "");
      }

      const currentOrderById = new Map(
        statements.map((s) => [s.id, (s as IStatement).data.territory?.order])
      );
      const territoryIdById = new Map(
        statements.map((s) => [s.id, (s as IStatement).data.territory?.territoryId])
      );

      const updatesPayload = updates
        .filter((u) => {
          const tid = territoryIdById.get(u.id);
          const current = currentOrderById.get(u.id);
          return !!tid && current !== u.order;
        })
        .map((u) => ({
          id: u.id,
          territoryId: territoryIdById.get(u.id) as string,
          order: u.order,
        }));

      if (updatesPayload.length > 0) {
        const now = new Date();
        await rethink
          .expr(updatesPayload)
          .forEach((u: RDatum) =>
            rethink
              .table(Entity.table)
              .get(u("id"))
              .update({
                data: { territory: { territoryId: u("territoryId"), order: u("order") } },
                updatedAt: now,
              })
          )
          .run(request.db.connection);

        // Bulk path bypassed Entity.update, so invalidate the entity cache
        // for each reordered row manually.
        for (const u of updatesPayload) {
          cache.delete(entityCacheKey(u.id));
        }
      }

      return {
        result: true,
        message: `${updates.length} statements reordered`,
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
