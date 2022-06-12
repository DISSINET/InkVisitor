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
  IResponseSearch,
  RequestSearch,
} from "@shared/types";
import {
  EntityDoesNotExist,
  BadParams,
  InternalServerError,
  ModelNotValidError,
  PermissionDeniedError,
} from "@shared/types/errors";
import { Request, Router } from "express";
import { asyncRouteHandler } from "../index";
import { ResponseSearch } from "@models/entity/response-search";
import { IRequestSearch } from "@shared/types/request-search";

export default Router()
  .get(
    "/:entityId",
    asyncRouteHandler<IResponseEntity>(async (request: Request) => {
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
  .get(
    "/",
    asyncRouteHandler<IResponseSearch[]>(async (httpRequest: Request) => {
      const req = new RequestSearch(httpRequest.query as IRequestSearch);
      if (req.label && req.label.length < 2) {
        return [];
      }

      const err = req.validate();
      if (err) {
        throw err;
      }

      const response = new ResponseSearch(req);
      await response.prepare(httpRequest);
      return response.getResults();
    })
  )
  .post(
    "/",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const model = getEntityClass(request.body as Record<string, unknown>);

      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      const user = request.getUserOrFail();

      if (!model.canBeCreatedByUser(user)) {
        throw new PermissionDeniedError("entity cannot be created");
      }

      const result = await model.save(request.db.connection);

      if (
        result.first_error &&
        result.first_error.indexOf("Duplicate") !== -1
      ) {
        throw new ModelNotValidError("id already exists");
      }

      if (result.inserted === 1) {
        await Audit.createNew(
          request.db.connection,
          user,
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
  .put(
    "/:entityId",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const entityId = request.params.entityId;
      const entityData = request.body as Record<string, unknown>;

      // not validation, just required data for this operation
      if (!entityId || !entityData || Object.keys(entityData).length === 0) {
        throw new BadParams("entity id and data have to be set");
      }

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
        await Audit.createNew(
          request.db.connection,
          request.getUserOrFail(),
          entityId,
          entityData
        );

        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot update entity ${entityId}`);
      }
    })
  )
  .delete(
    "/:entityId",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const entityId = request.params.entityId;

      if (!entityId) {
        throw new BadParams("entity id has to be set");
      }

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
  .get(
    "/:entityId/detail",
    asyncRouteHandler<IResponseDetail>(async (request: Request) => {
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
  );
