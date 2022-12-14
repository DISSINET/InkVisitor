import { mergeDeep } from "@common/functions";
import { ResponseEntity, ResponseEntityDetail } from "@models/entity/response";
import Audit from "@models/audit/audit";
import { getEntityClass } from "@models/factory";
import { findEntityById } from "@service/shorthands";
import {
  IEntity,
  IResponseEntity,
  IResponseDetail,
  IResponseGeneric,
  RequestSearch,
  EntityTooltip,
} from "@shared/types";
import {
  EntityDoesNotExist,
  BadParams,
  InternalServerError,
  ModelNotValidError,
  PermissionDeniedError,
} from "@shared/types/errors";
import { Router } from "express";
import { asyncRouteHandler } from "../index";
import { ResponseSearch } from "@models/entity/response-search";
import { IRequestSearch } from "@shared/types/request-search";
import { getAuditByEntityId } from "@modules/audits";
import { ResponseTooltip } from "@models/entity/response-tooltip";
import { IRequest } from "src/custom_typings/request";

export default Router()
  /**
   * @openapi
   * /entities/{entityId}:
   *   get:
   *     description: Returns entity entry
   *     tags:
   *       - entities
   *     parameters:
   *       - in: path
   *         name: entityId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the entity entry
   *     responses:
   *       200:
   *         description: Returns IResponseEntity object for entity entry
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseEntity"
   */
  .get(
    "/:entityId",
    asyncRouteHandler<IResponseEntity>(async (request: IRequest) => {
      const entityId = request.params.entityId;

      if (!entityId) {
        throw new BadParams("entityId has to be set");
      }

      const entityData = await findEntityById<IEntity>(
        request.db,
        entityId as string
      );

      if (!entityData) {
        throw new EntityDoesNotExist(
          `entity ${entityId} was not found`,
          entityId
        );
      }
      const entity = getEntityClass({ ...entityData });

      const response = new ResponseEntity(entity);

      await response.prepare(request);

      return response;
    })
  )
  /**
   * @openapi
   * /entities/{entityId}/audits:
   *   get:
   *     description: Returns audit data for entity
   *     tags:
   *       - entities
   *     parameters:
   *       - in: path
   *         name: entityId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the entity entry
   *     responses:
   *       200:
   *         description: Returns ResponseAudit object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseAudit"
   */
  .get("/:entityId/audits", getAuditByEntityId)
  /**
   * @openapi
   * /entities/:
   *   get:
   *     description: Returns list of filtered entity entries
   *     tags:
   *       - entities
   *     parameters:
   *       - in: query
   *         name: search params
   *         schema:
   *           $ref: "#/components/schemas/IRequestSearch"
   *         required: true
   *         description: search options for the query
   *         style: form
   *         explode: true
   *     responses:
   *       200:
   *         description: Returns list of entity entries
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items: 
   *                 $ref: "#/components/schemas/IResponseEntity"
   */
  .get(
    "/",
    asyncRouteHandler<IResponseEntity[]>(async (httpRequest: IRequest) => {
      const req = new RequestSearch(httpRequest.query as IRequestSearch);
      if (req.label && req.label.length < 2) {
        return [];
      }

      const err = req.validate();
      if (err) {
        throw err;
      }

      const response = new ResponseSearch(req);
      return await response.prepare(httpRequest);
    })
  )
  /**
   * @openapi
   * /entities/:
   *   post:
   *     description: Create a new entity entry
   *     tags:
   *       - entities
   *     requestBody:
   *       description: Entity object
   *       content: 
   *         application/json:
   *           schema:
   *             allOf:
   *               - $ref: "#/components/schemas/IEntity"               
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .post(
    "/",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const model = getEntityClass(request.body as Record<string, unknown>);

      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      if (!model.canBeCreatedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("entity cannot be created");
      }

      await request.db.lock();

      const result = await model.save(request.db.connection);

      if (
        result.first_error &&
        result.first_error.indexOf("Duplicate") !== -1
      ) {
        throw new ModelNotValidError("id already exists");
      }

      if (result.inserted === 1) {
        await Audit.createNew(
          request,
          model.id,
          request.body
        );
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot create entity`);
      }
    })
  )
  /**
   * @openapi
   * /entities/{entityId}:
   *   put:
   *     description: Update an existing entity entry
   *     tags:
   *       - entities
   *     parameters:
   *       - in: path
   *         name: entityId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the entity entry
   *     requestBody:
   *       description: Entity object
   *       content: 
   *         application/json:
   *           schema:
   *             allOf:
   *               - $ref: "#/components/schemas/IEntity"               
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .put(
    "/:entityId",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const entityId = request.params.entityId;
      const entityData = request.body as Record<string, unknown>;

      // not validation, just required data for this operation
      if (!entityId || !entityData || Object.keys(entityData).length === 0) {
        throw new BadParams("entity id and data have to be set");
      }

      await request.db.lock();

      // entityId must be already in the db
      const existingEntity = await findEntityById(request.db, entityId);
      if (!existingEntity) {
        throw new EntityDoesNotExist(
          `entity with id ${entityId} does not exist`,
          entityId
        );
      }

      // get correct IDbModel implementation
      const model = getEntityClass({
        ...mergeDeep(existingEntity, entityData),
        class: existingEntity.class,
        id: entityId,
      });

      // checking the validity of the final model (already has updated data)
      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      if (!model.canBeEditedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("entity cannot be saved");
      }

      // update only the required fields
      const result = await model.update(request.db.connection, entityData);

      if (result.replaced || result.unchanged) {
        await Audit.createNew(request, entityId, entityData);

        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot update entity ${entityId}`);
      }
    })
  )
  /**
   * @openapi
   * /entities/{entityId}:
   *   delete:
   *     description: Delete an entity entry
   *     tags:
   *       - entities
   *     parameters:
   *       - in: path
   *         name: entityId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the entity entry             
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .delete(
    "/:entityId",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const entityId = request.params.entityId;

      if (!entityId) {
        throw new BadParams("entity id has to be set");
      }

      await request.db.lock();

      // entityId must be already in the db
      const existingEntity = await findEntityById(request.db, entityId);
      if (!existingEntity) {
        throw new EntityDoesNotExist(
          `entity with id ${entityId} does not exist`,
          entityId
        );
      }

      // get correct IDbModel implementation
      const model = getEntityClass({
        class: existingEntity.class,
        id: entityId,
      });

      if (!model.canBeDeletedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError(
          "entity cannot be deleted by current user"
        );
      }

      const result = await model.delete(request.db.connection);

      if (result.deleted === 1) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot delete entity ${entityId}`);
      }
    })
  )
  /**
   * @openapi
   * /entities/{entityId}/detail:
   *   get:
   *     description: Returns detail for entity entry
   *     tags:
   *       - entities
   *     parameters:
   *       - in: path
   *         name: entityId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the entity entry
   *     responses:
   *       200:
   *         description: Returns IResponseDetail object for entity entry
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items: 
   *                 $ref: "#/components/schemas/IResponseDetail"
   */
  .get(
    "/:entityId/detail",
    asyncRouteHandler<IResponseDetail>(async (request: IRequest) => {
      const entityId = request.params.entityId;

      if (!entityId) {
        throw new BadParams("entity id has to be set");
      }

      const entityData = await findEntityById(request.db, entityId);
      if (!entityData) {
        throw new EntityDoesNotExist(
          `entity ${entityId} was not found`,
          entityId
        );
      }

      const entity = getEntityClass({ ...entityData });

      if (!entity.canBeViewedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError(`cannot view entity ${entityId}`);
      }

      const response = new ResponseEntityDetail(entity);

      await response.prepare(request);

      return response;
    })
  )
  /**
   * @openapi
   * /entities/{entityId}/tooltip:
   *   get:
   *     description: Returns tooltip detail for entity entry
   *     tags:
   *       - entities
   *     parameters:
   *       - in: path
   *         name: entityId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the entity entry
   *     responses:
   *       200:
   *         description: Returns EntityTooltipIResponse object for entity entry
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/EntityTooltipIResponse"
   */
  .get(
    "/:entityId/tooltip",
    asyncRouteHandler<EntityTooltip.IResponse>(async (request: IRequest) => {
      const entityId = request.params.entityId;

      if (!entityId) {
        throw new BadParams("entity id has to be set");
      }

      const entityData = await findEntityById(request.db, entityId);
      if (!entityData) {
        throw new EntityDoesNotExist(
          `entity ${entityId} was not found`,
          entityId
        );
      }

      const entity = getEntityClass({ ...entityData });

      if (!entity.canBeViewedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError(`cannot view entity ${entityId}`);
      }

      const response = new ResponseTooltip(entity);

      await response.prepare(request);

      return response;
    })
  );
