import { mergeDeep, regExpEscape } from "@common/functions";
import { ResponseEntity, ResponseEntityDetail } from "@models/entity/response";
import Audit from "@models/audit/audit";
import { getEntityClass } from "@models/factory";
import { findEntityById } from "@service/shorthands";
import { EntityClass } from "@shared/enums";
import {
  IEntity,
  IResponseEntity,
  IResponseDetail,
  IResponseGeneric,
  IResponseSearch,
  RequestSearch,
} from "@shared/types";
import {
  EntityDoesNotExits,
  BadParams,
  InternalServerError,
  ModelNotValidError,
  PermissionDeniedError,
} from "@shared/types/errors";
import { Request, Router } from "express";
import { asyncRouteHandler } from "../index";
import Statement from "@models/statement/statement";
import { IResponseSearchOld } from "@shared/types/response-search";
import { ResponseSearch } from "@models/entity/response-search";
import { Connection, r, RDatum } from "rethinkdb-ts";
import Entity from "@models/entity/entity";

// DEPRECATED
export async function filterEntitiesByWildcard(
  connection: Connection,
  entityClass: EntityClass | false,
  entityClassExcluded: EntityClass[] | undefined,
  entityLabel: string | false,
  entityIds?: string[],
  onlyTemplates?: boolean,
  usedTemplate?: string
): Promise<IEntity[]> {
  let query = r.table(Entity.table);

  if (entityIds && entityIds.length) {
    query = query.getAll(r.args(entityIds)) as any;
  }

  if (entityClass) {
    query = query.filter({
      class: entityClass,
    });
  }

  if (usedTemplate) {
    query = query.filter({
      usedTemplate: usedTemplate,
    });
  }

  if (onlyTemplates) {
    query = query.filter({
      isTemplate: true,
    });
  }

  if (entityClassExcluded) {
    query = query.filter(function (row: RDatum) {
      return r.and.apply(
        r,
        entityClassExcluded.map((c) => row("class").ne(c)) as [
          RDatum<boolean>,
          ...RDatum<boolean>[]
        ]
      );
    });
  }

  if (entityLabel) {
    let leftWildcard: string = "^",
      rightWildcard: string = "$";

    if (entityLabel[0] === "*") {
      leftWildcard = "";
      entityLabel = entityLabel.slice(1);
    }

    if (entityLabel[entityLabel.length - 1] === "*") {
      rightWildcard = "";
      entityLabel = entityLabel.slice(0, -1);
    }

    entityLabel = regExpEscape(entityLabel.toLowerCase());

    query = query.filter(function (row: RDatum) {
      return row("label")
        .downcase()
        .match(`${leftWildcard}${entityLabel}${rightWildcard}`);
    });
  }

  return query.run(connection);
}

export default Router()
  .get(
    "/get/:entityId?",
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
        throw new EntityDoesNotExits(
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
  // DEPRECATED
  .post(
    "/getMore",
    asyncRouteHandler<IResponseEntity[]>(async (request: Request) => {
      const label = request.body.label;
      const classParam = request.body.class;
      const excluded: EntityClass[] = request.body.excluded;
      const onlyTemplates: undefined | boolean = request.body.onlyTemplates;
      const usedTemplate: undefined | string = request.body.usedTemplate;

      if (!label && !classParam && !onlyTemplates && !usedTemplate) {
        throw new BadParams("label or class has to be set");
      }

      if (label && label.length < 2) {
        return [];
      }

      if (
        typeof excluded !== "undefined" &&
        excluded.constructor.name !== "Array"
      ) {
        throw new BadParams("excluded need to be array");
      }

      const entities = await filterEntitiesByWildcard(
        request.db.connection,
        classParam,
        excluded,
        label,
        undefined,
        onlyTemplates,
        usedTemplate
      );

      const responses: IResponseEntity[] = [];
      for (const entityData of entities) {
        const response = new ResponseEntity(getEntityClass(entityData));
        await response.prepare(request);
        responses.push(response);
      }

      return responses;
    })
  )
  .get(
    "/",
    asyncRouteHandler<IResponseSearch[]>(async (httpRequest: Request) => {
      const req = new RequestSearch(httpRequest.body);
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
    "/create",
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
    "/update/:entityId?",
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
        throw new EntityDoesNotExits(
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
    "/delete/:entityId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const entityId = request.params.entityId;

      if (!entityId) {
        throw new BadParams("entity id has to be set");
      }

      // entityId must be already in the db
      const existingEntity = await findEntityById(request.db, entityId);
      if (!existingEntity) {
        throw new EntityDoesNotExits(
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
    "/detail/:entityId?",
    asyncRouteHandler<IResponseDetail>(async (request: Request) => {
      const entityId = request.params.entityId;

      if (!entityId) {
        throw new BadParams("entity id has to be set");
      }

      const entityData = await findEntityById(request.db, entityId);
      if (!entityData) {
        throw new EntityDoesNotExits(
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
  // DEPRECATED
  .post(
    "/search",
    asyncRouteHandler<IResponseSearchOld[]>(async (httpRequest: Request) => {
      const req = new RequestSearch(httpRequest.body);
      if (req.label && req.label.length < 2) {
        return [];
      }

      const err = req.validate();
      if (err) {
        throw err;
      }

      let associatedEntityIds: string[] | undefined = undefined;
      if (req.entityId) {
        associatedEntityIds = await Statement.findIdsByDataEntityId(
          httpRequest.db.connection,
          req.entityId
        );

        // entity id provided, but not found within statements - end now
        if (!associatedEntityIds.length) {
          return [];
        }
      }

      // filter out duplicates
      associatedEntityIds = [...new Set(associatedEntityIds)];

      const entities = await filterEntitiesByWildcard(
        httpRequest.db.connection,
        req.class,
        req.excluded,
        req.label,
        associatedEntityIds
      );

      return entities.map((a: IEntity) => {
        const out: IResponseSearchOld = {
          entityId: a.id,
          entityLabel: a.label,
          class: a.class,
        };

        // only for Entity (grouped entity of EntityClass)
        if (a.data.logicalType) {
          out.logicalType = (a as IEntity).data.logicalType;
        }
        return out;
      });
    })
  );
