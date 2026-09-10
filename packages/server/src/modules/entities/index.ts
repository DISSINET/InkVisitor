import { mergeDeep } from "@common/functions";

import Audit from "@models/audit/audit";
import Entity from "@models/entity/entity";
import { ResponseEntity, ResponseEntityDetail } from "@models/entity/response";
import { ResponseSearch } from "@models/entity/response-search";
import { ResponseTooltip } from "@models/entity/response-tooltip";
import { getEntityClass, getRelationClass } from "@models/factory";
import { copyRelations } from "@models/relation/functions";
import Relation from "@models/relation/relation";
import { getAuditByEntityId } from "@modules/audits";
import QuerySearch from "@service/query/search";
import { findEntityById } from "@service/shorthands";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import {
  EntityTooltip,
  IEntity,
  IProp,
  IPropSpec,
  IReference,
  IResourceData,
  IResponseDetail,
  IResponseEntity,
  IResponseGeneric,
  ITerritory,
  IUser,
  Relation as RelationType,
  RequestSearch,
  AuditScope,
} from "@inkvisitor/shared/types";
import {
  AuditDoesNotExist,
  BadParams,
  CustomError,
  EntityDoesNotExist,
  IInvalidDeleteErrorData,
  InternalServerError,
  InvalidDeleteError,
  ModelNotValidError,
  PermissionDeniedError,
  TerritoryDoesNotExits,
} from "@inkvisitor/shared/types/errors";
import { IRequestQuery, IRequestQueryExport } from "@inkvisitor/shared/types/request-query";
import { IBatchSetAttributeChanges } from "@inkvisitor/shared/types/request-batch";
import { Explore } from "@inkvisitor/shared/types/query";
import { IRequestSearch } from "@inkvisitor/shared/types/request-search";
import Document from "@models/document/document";
import Territory from "@models/territory/territory";
import { IResponseQuery } from "@inkvisitor/shared/types/response-query";

import {
  EventType,
  EXPLORE_STATS_ENTITY_LIMIT,
} from "@inkvisitor/shared/types/stats";
import { Router } from "express";
import { IRequest } from "src/custom_typings/request";
import { asyncRouteHandler } from "../index";
import User from "@models/user/user";
import { randomUUID } from "crypto";

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
    asyncRouteHandler<IResponseEntity>(async (request: IRequest<{ entityId: string }>) => {
      const entityId = request.params.entityId;

      if (!entityId) {
        throw new BadParams("entityId has to be set");
      }

      const entityData = await findEntityById<IEntity>(request.db, entityId as string);

      if (!entityData) {
        throw new EntityDoesNotExist(`entity ${entityId} was not found`, entityId);
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
    asyncRouteHandler<IResponseEntity[]>(
      async (req: IRequest<unknown, unknown, IRequestSearch>) => {
        const search = new RequestSearch(req.query);
        if (
          (search.label && search.label.length < 2) ||
          (search.labelOrId && search.labelOrId.length < 2)
        ) {
          return [];
        }

        const err = search.validate();
        if (err) {
          throw err;
        }

        const response = new ResponseSearch(search);
        return await response.prepare(req);
      }
    )
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

      await model.beforeSave(request.db.connection);

      const saved = await model.save(request.db.connection);
      if (!saved) {
        throw new InternalServerError("cannot create entity");
      }

      const out: IResponseGeneric = { result: true, data: model };

      if (model.usedTemplate) {
        await model.applyTemplate(request, model.usedTemplate);
        try {
          await copyRelations(request, model.usedTemplate, model.id, [
            RelationEnums.Type.Classification,
            RelationEnums.Type.Related,
          ]);
        } catch (e) {
          out.message = "At least one relation not applied";
        }
      }

      await Audit.createNew(request, AuditScope.Entity, model.id, request.body, EventType.CREATE);

      return out;
    })
  )
  /**
   * @openapi
   * /entities/:entityId/clone:
   *   post:
   *     description: Create a new cloned entity from another
   *     tags:
   *       - entities
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .post(
    "/:entityId/clone",
    asyncRouteHandler<IResponseGeneric<IEntity>>(
      async (request: IRequest<{ entityId: string }>) => {
        const originalId = request.params.entityId as string;
        const original = await findEntityById(request.db, originalId);
        if (!original) {
          throw new EntityDoesNotExist("cannot copy entity - does not exist", originalId);
        }

        // clone the entry without id and with recreated ids - should be created anew
        const clone = getEntityClass({
          ...original,
          id: "",
          legacyId: undefined,
        } as Partial<IEntity>);
        if (!clone.isValid()) {
          throw new ModelNotValidError("");
        }

        if (!clone.canBeCreatedByUser(request.getUserOrFail())) {
          throw new PermissionDeniedError("entity cannot be copied");
        }

        clone.resetIds();

        await request.db.lock();

        const saved = await clone.save(request.db.connection);
        if (!saved) {
          throw new InternalServerError("cannot copy entity");
        }

        await Audit.createNew(request, AuditScope.Entity, clone.id, clone, EventType.CREATE);

        const rels = (await Relation.findForEntities(request.db.connection, [originalId])).filter(
          (rel) => {
            const relType = RelationType.RelationRules[rel.type];
            if (!relType?.asymmetrical) {
              return true;
            } else {
              return rel.entityIds.indexOf(originalId) === 0;
            }
          }
        );

        const relsWithClas = rels.map((r) => getRelationClass(r));
        const relsCopied = await Relation.copyMany(request, relsWithClas, originalId, clone.id);

        return {
          result: true,
          message:
            relsCopied !== relsWithClas.length
              ? "There has been at least one conflict while copying relations"
              : undefined,
          data: clone,
        };
      }
    )
  )
  .post(
    "/:entityId/restore",
    asyncRouteHandler<IResponseGeneric<object>>(
      async (request: IRequest<{ entityId?: string }, {}, {}>) => {
        const entityId = request.params.entityId || "";
        const audit = await Audit.getLastForEntity(request.db.connection, entityId);
        if (!audit) {
          throw new AuditDoesNotExist("cannot restore entity - audit does not exist", entityId);
        }

        // The deletion audit carries the full snapshot of the deleted entity.
        // Entities deleted before snapshots were stored have empty changes, so
        // fall back to the create audit, whose changes always hold the full
        // entity (create requests submit the whole entity).
        let snapshot = audit.changes as Partial<IEntity>;
        if (!snapshot || !snapshot.class) {
          const createAudit = await Audit.getFirstForEntity(
            request.db.connection,
            entityId
          );
          if (createAudit && (createAudit.changes as Partial<IEntity>)?.class) {
            snapshot = createAudit.changes as Partial<IEntity>;
          }
        }
        if (!snapshot || !snapshot.class) {
          throw new ModelNotValidError(
            "cannot restore entity - no snapshot available to restore from"
          );
        }

        const restoration = getEntityClass({
          ...snapshot,
        } as Partial<IEntity>);
        if (!restoration.isValid()) {
          throw new ModelNotValidError("");
        }

        if (!restoration.canBeCreatedByUser(request.getUserOrFail())) {
          throw new PermissionDeniedError("entity cannot be restored");
        }

        await request.db.lock();

        const saved = await restoration.save(request.db.connection);
        if (!saved) {
          throw new InternalServerError("cannot restore entity");
        }

        return {
          result: true,
          message: "Entity restored",
          data: snapshot,
        };
      }
    )
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
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest<{ entityId: string }>) => {
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
        throw new EntityDoesNotExist(`entity with id ${entityId} does not exist`, entityId);
      }

      // the id is copied out rather than held by reference: the merge below
      // writes the update into existingEntity, mutating the parent object itself
      const parentIdBeforeUpdate =
        existingEntity.class === EntityEnums.Class.Territory &&
        (existingEntity as ITerritory).data?.parent
          ? ((existingEntity as ITerritory).data.parent as { territoryId: string })
              .territoryId
          : undefined;

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

      // Re-parenting a Territory through this route is the same operation the
      // tree position route performs, and needs the same right on the branch it
      // lands in: canBeEditedByUser derives the right for the moved Territory
      // alone, which says nothing about where it is going.
      if (existingEntity.class === EntityEnums.Class.Territory) {
        const newParent = (model as Territory).data.parent;
        const newParentId = newParent ? newParent.territoryId : undefined;
        if (
          newParentId &&
          newParentId !== parentIdBeforeUpdate
        ) {
          const parentData = await findEntityById<ITerritory>(
            request.db,
            newParentId
          );
          if (!parentData || parentData.class !== EntityEnums.Class.Territory) {
            throw new TerritoryDoesNotExits(
              `territory ${newParentId} was not found`,
              newParentId
            );
          }
          if (
            !new Territory(parentData).canBeEditedByUser(
              request.getUserOrFail()
            )
          ) {
            throw new PermissionDeniedError(
              `cannot move territory under ${newParentId}`
            );
          }
        }
      }

      await model.beforeSave(request.db.connection);

      // update only the required fields
      const result = await model.update(request.db.connection, entityData);

      if (result.replaced || result.unchanged) {
        await Audit.createNew(request, AuditScope.Entity, entityId, entityData, EventType.EDIT);

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
    "/:entityId?",
    asyncRouteHandler<IResponseGeneric<Record<string, CustomError | true>>>(
      async (req: IRequest<{ entityId?: string }, { entityIds?: string[] }>) => {
        let ids: string[] | undefined;
        if (req.params.entityId) {
          ids = [req.params.entityId];
        } else if (req.body.entityIds) {
          ids = req.body.entityIds;
        }

        if (!ids || ids.length === 0) {
          throw new BadParams("at least one entity id needs to be provided");
        }

        await req.db.lock();

        const out: IResponseGeneric<Record<string, CustomError | true>> = {
          result: true,
        };

        out.data = {};

        // entity should exist
        const existing = await Entity.findEntitiesByIds(req.db.connection, ids);
        for (const wantedId of ids) {
          if (!existing.find((e) => e.id === wantedId)) {
            out.result = false;
            out.data[wantedId] = new EntityDoesNotExist(
              `entity with id ${wantedId} does not exist`,
              wantedId
            );
          }
        }

        // key is id of entity, that depends on entities, that will be deleted (value array)
        let dependencyMap: Record<string, string[]> = {};
        // function will remove removedId as dependency from possible waiting entries
        const removeDependency = (removedId: string) => {
          for (const entityId of Object.keys(dependencyMap)) {
            const index = dependencyMap[entityId].indexOf(removedId);
            if (index !== -1) {
              dependencyMap[entityId].splice(index, 1);
            }
          }
          delete dependencyMap[removedId];
        };

        // check for any blocking reasons for not deleting the entity + construct dependency map
        for (const entity of existing) {
          // if relations are linked to this entity, the delete should not be allowed
          const [linkIds, relIds] = await Relation.getLinkedForEntities(req.db.connection, [
            entity.id,
          ]);
          if (relIds.length) {
            out.result = false;
            out.data[entity.id] = new InvalidDeleteError(
              `Cannot be deleted while linked to relations (${
                relIds[0] + (relIds.length > 1 ? " + " + (relIds.length - 1) + " others" : "")
              })`
            ).withData<IInvalidDeleteErrorData>({ type: "entity", ids: linkIds });
            continue;
          }

          const docs = await Document.findByEntityId(req.db.connection, entity.id);
          if (docs.length) {
            out.result = false;
            out.data[entity.id] = new InvalidDeleteError(
              `Cannot be deleted while anchored to documents (${
                docs[0].id + (docs.length > 1 ? " + " + (docs.length - 1) + " others" : "")
              })`
            ).withData<IInvalidDeleteErrorData>({
              type: "document",
              ids: docs.map((d) => d.id),
            });
            continue;
          }

          // a Resource owning a document (data.documentId) must have it
          // detached first, else the document would be orphaned. A dangling
          // documentId (document row already gone) does not block.
          if (entity.class === EntityEnums.Class.Resource) {
            const ownedDocId = (entity.data as Partial<IResourceData>)
              ?.documentId;
            if (
              ownedDocId &&
              (await Document.getDocumentById(req.db.connection, ownedDocId))
            ) {
              out.result = false;
              out.data[entity.id] = new InvalidDeleteError(
                `Cannot be deleted while a document is attached (${ownedDocId})`
              ).withData<IInvalidDeleteErrorData>({
                type: "attachedDocument",
                ids: [ownedDocId],
              });
              continue;
            }
          }

          const model = getEntityClass(entity);
          if (!model.canBeDeletedByUser(req.getUserOrFail())) {
            out.result = false;
            out.data[entity.id] = new PermissionDeniedError(
              "entity cannot be deleted by current user"
            );
            continue;
          }

          dependencyMap[entity.id] = [];

          // find other entities dependend on this one
          const usedBy = await model.getUsedByEntity(req.db.connection);
          if (usedBy.length) {
            // "reference" steers the client to the target's own detail, whose
            // "Used in" reference tables list every blocker; mixed conflicts
            // (statement + reference usage) resolve to "reference" since that
            // detail shows the statement usages too. `ids` always carries the
            // full blocker list - the dependencyMap cascade below relies on it.
            const viaReference = usedBy.some((e) =>
              (e.references ?? []).some(
                (ref) =>
                  ref.resource === entity.id || ref.value === entity.id
              )
            );
            out.result = false;
            out.data[entity.id] = new InvalidDeleteError(
              `Referenced by other entities`
            ).withData<IInvalidDeleteErrorData>({
              type: viaReference ? "reference" : "entity",
              ids: usedBy.map((e) => e.id),
            });
            dependencyMap[entity.id] = usedBy.map((e) => e.id);
            continue;
          }
        }

        let removedCount: number;
        do {
          removedCount = 0;
          for (const entityId of Object.keys(dependencyMap)) {
            if (dependencyMap[entityId].length === 0) {
              try {
                const deletedEntity = existing.find((e) => e.id === entityId);
                const model = getEntityClass(deletedEntity);
                if ((await model.delete(req.db.connection)).deleted !== 1) {
                  throw new InternalServerError(`cannot delete entity ${entityId}`);
                }
                out.data[entityId] = true;
                await Audit.createDeletionAudit(
                  req.db.connection,
                  entityId,
                  req.getUserOrFail().id,
                  AuditScope.Entity,
                  // store the full entity snapshot so it can be restored later
                  deletedEntity ? { ...deletedEntity } : {}
                );
                removeDependency(entityId);
                removedCount++;
              } catch (e) {
                out.result = false;
                out.data[entityId] = e as CustomError;
              }
            }
          }
        } while (removedCount > 0);

        out.result = Object.keys(out.data).reduce<boolean>(
          (acc, c) => acc && !!out.data && out.data[c] === true,
          true
        );

        // throw basic error if deleting single entity
        if (ids.length === 1 && !out.result) {
          throw out.data[Object.keys(out.data)[0]];
        }

        return out;
      }
    )
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
    asyncRouteHandler<IResponseDetail>(async (request: IRequest<{ entityId: string }>) => {
      const entityId = request.params.entityId;

      if (!entityId) {
        throw new BadParams("entity id has to be set");
      }

      const entityData = await findEntityById(request.db, entityId);
      if (!entityData) {
        throw new EntityDoesNotExist(`entity ${entityId} was not found`, entityId);
      }

      const entity = getEntityClass({ ...entityData });

      // Read-only detail view is consistent with the unrestricted base
      // GET /:entityId. Territory/statement-level access for mutations is
      // enforced via entity.right in the response (write/admin vs read-only).

      const response = new ResponseEntityDetail(entity);

      await response.prepare(request);

      return response;
    })
  )
  /**
   * @openapi
   * /entities/{entityId}/relations:
   *   get:
   *     description: Retrieves relations linked to the entity, optionally filtered by relation type. By default (forward=true) only forward relations are returned - for asymmetrical relations those where the entity is the subject (entityIds[0]). Pass forward=false to return relations in both directions.
   *     tags:
   *       - entities
   *     parameters:
   *       - in: path
   *         name: entityId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the entity entry
   *       - in: query
   *         name: filters[relationType]
   *         schema:
   *           type: string
   *         description: type of relations to return
   *       - in: query
   *         name: forward
   *         schema:
   *           type: boolean
   *         description: when true (default) returns forward relations only; when false returns both directions
   *     responses:
   *       200:
   *         description: Returns array with relation entries
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/RelationIModel"
   */
  .get(
    "/:entityId/relations",
    asyncRouteHandler<RelationType.IRelation[]>(
      async (
        request: IRequest<
          { entityId: string },
          unknown,
          { filters?: { relationType?: RelationEnums.Type }; forward?: string }
        >
      ) => {
        const entityId = request.params.entityId;

        if (!entityId) {
          throw new BadParams("entity id has to be set");
        }

        const relationType = request.query.filters?.relationType;
        // default true - only "false" opts into bidirectional results
        const forward = request.query.forward !== "false";

        // forward-only keeps, for asymmetrical relations, those where the entity
        // is the subject (entityIds[0]) - mirrors the Explorer ER column display
        const relations = forward
          ? await Relation.findForwardForEntity<RelationType.IRelation>(
              request.db.connection,
              entityId,
              relationType
            )
          : await Relation.findForEntities<RelationType.IRelation>(
              request.db.connection,
              [entityId],
              relationType
            );

        return relations;
      }
    )
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
        throw new EntityDoesNotExist(`entity ${entityId} was not found`, entityId);
      }

      const entity = getEntityClass({ ...entityData });

      // The tooltip is a read-only lightweight preview, equivalent in
      // sensitivity to the base GET /:entityId which has no canBeViewedByUser
      // gate. Removing the check keeps the two endpoints consistent and lets
      // all logged-in users (Editors, Viewers) see statement tooltips in the
      // Explorer where they may encounter statements from territories they are
      // not directly assigned to.

      const response = new ResponseTooltip(entity);

      await response.prepare(request);

      return response;
    })
  )
  .post(
    "/query",
    asyncRouteHandler<IResponseQuery>(async (request: IRequest<undefined, IRequestQuery>) => {
      const querySearch = new QuerySearch(request.body.query, request.body.explore);

      await querySearch.run(request.db.connection);

      // Stats view: aggregate audit stats over the whole filtered subset and
      // skip the per-row column computation / pagination entirely.
      if (request.body.explore.view.mode === Explore.EViewMode.Stats) {
        const stats = await querySearch.getStats(request.db.connection);
        const entityIds = querySearch.results?.items ?? [];

        return {
          query: request.body.query,
          entityIds,
          entities: [],
          explore: querySearch.explore,
          total: entityIds.length,
          expansion: querySearch.expansionCounts,
          stats,
          statsEntityLimit: EXPLORE_STATS_ENTITY_LIMIT,
        };
      }

      const results = await querySearch.getResults(request.db.connection);

      // The table renders editable cells for a row only when its entity may be
      // edited, so each row carries the mode the same rules produce elsewhere.
      // Every path behind it reads the in-memory tree cache or the entity's own
      // fields, so this costs no further queries.
      const queryUser = request.getUserOrFail();
      for (const row of results) {
        row.right = getEntityClass({ ...row.entity }).getUserRoleMode(queryUser);
      }

      const entityIds = querySearch.results?.items ?? [];

      return {
        query: request.body.query,
        entityIds,
        entities: results,
        explore: querySearch.explore,
        total: entityIds.length,
        expansion: querySearch.expansionCounts,
      };
    })
  )

  .post(
    "/query-export",
    asyncRouteHandler<any>(async (request: IRequest<undefined, IRequestQueryExport>) => {
      const { query, explore, rowIndices } = request.body;

      const exportExplore = { ...explore, ...{ limit: 0 } };

      const querySearch = new QuerySearch(query, exportExplore);

      const ids = await querySearch.run(request.db.connection);

      const results = await querySearch.getResults(request.db.connection, rowIndices);

      // create csv text
      const tsvBodyRows = results
        .map((result) => {
          const rEntity = result.entity;
          const rowColValues: string[] = [parseColumnValue(rEntity)];

          Object.values(result.columnData).forEach((columnValue) => {
            if (columnValue instanceof Array) {
              rowColValues.push(
                columnValue.map((columnValuePart) => parseColumnValue(columnValuePart)).join(",")
              );
            } else {
              rowColValues.push(parseColumnValue(columnValue));
            }
          });
          return rowColValues.join("\t");
        })
        .join("\n");

      const exportColumns =
        explore.view.mode === Explore.EViewMode.Table ? explore.view.columns : [];
      const tsvHeader =
        "result\t" + exportColumns.map((c) => c.name).join("\t");

      return { tsvText: tsvHeader + "\n" + tsvBodyRows };
    })
  )

  .post(
    "/batchAddMetaprop",
    asyncRouteHandler<IResponseGeneric>(
      async (
        request: IRequest<
          unknown,
          {
            entityIds: string[];
            propData: {
              logic: string;
              certainty: string;
              mood: string[];
              moodvariant: string;
              type: IPropSpec;
              value: IPropSpec;
            };
          }
        >
      ) => {
        const { entityIds, propData } = request.body;

        if (
          !entityIds ||
          !Array.isArray(entityIds) ||
          entityIds.length === 0 ||
          !propData?.type?.entityId
        ) {
          throw new BadParams("entityIds array and propData.type.entityId must be provided");
        }

        await request.db.lock();

        const entities = await Entity.findEntitiesByIds(request.db.connection, entityIds);

        if (entities.length === 0) {
          throw new EntityDoesNotExist("none of the provided entities were found", entityIds[0]);
        }

        const user = request.getUserOrFail();
        const errors: Record<string, string> = {};
        let updated = 0;

        for (const entityData of entities) {
          const newProp: IProp = {
            id: randomUUID(),
            elvl: EntityEnums.Elvl.Inferential,
            certainty: (propData.certainty as EntityEnums.Certainty) || EntityEnums.Certainty.Empty,
            logic: (propData.logic as EntityEnums.Logic) || EntityEnums.Logic.Positive,
            mood: (propData.mood as EntityEnums.Mood[]) || [EntityEnums.Mood.Indication],
            moodvariant:
              (propData.moodvariant as EntityEnums.MoodVariant) || EntityEnums.MoodVariant.Realis,
            bundleOperator: EntityEnums.Operator.And,
            bundleStart: false,
            bundleEnd: false,
            children: [],
            type: {
              entityId: propData.type.entityId,
              elvl: (propData.type.elvl as EntityEnums.Elvl) || EntityEnums.Elvl.Inferential,
              logic: (propData.type.logic as EntityEnums.Logic) || EntityEnums.Logic.Positive,
              virtuality:
                (propData.type.virtuality as EntityEnums.Virtuality) ||
                EntityEnums.Virtuality.Reality,
              partitivity:
                (propData.type.partitivity as EntityEnums.Partitivity) ||
                EntityEnums.Partitivity.Unison,
            },
            value: {
              entityId: propData.value?.entityId || "",
              elvl: (propData.value?.elvl as EntityEnums.Elvl) || EntityEnums.Elvl.Inferential,
              logic: (propData.value?.logic as EntityEnums.Logic) || EntityEnums.Logic.Positive,
              virtuality:
                (propData.value?.virtuality as EntityEnums.Virtuality) ||
                EntityEnums.Virtuality.Reality,
              partitivity:
                (propData.value?.partitivity as EntityEnums.Partitivity) ||
                EntityEnums.Partitivity.Unison,
            },
          };

          const updatedProps = [...entityData.props, newProp];
          const updateData: Partial<IEntity> = { props: updatedProps };

          const model = getEntityClass({
            ...mergeDeep(entityData, updateData),
            class: entityData.class,
            id: entityData.id,
          });

          if (!model.isValid()) {
            errors[entityData.id] = "model not valid";
            continue;
          }

          if (!model.canBeEditedByUser(user)) {
            errors[entityData.id] = "permission denied";
            continue;
          }

          await model.beforeSave(request.db.connection);
          const result = await model.update(request.db.connection, updateData);

          if (result.replaced || result.unchanged) {
            await Audit.createNew(request, AuditScope.Entity, entityData.id, updateData, EventType.EDIT);
            updated++;
          } else {
            errors[entityData.id] = "update failed";
          }
        }

        return {
          result: updated > 0,
          message: `Updated ${updated}/${entities.length} entities${
            Object.keys(errors).length ? `. Errors: ${JSON.stringify(errors)}` : ""
          }`,
        };
      }
    )
  )

  .post(
    "/batchAddReference",
    asyncRouteHandler<IResponseGeneric>(
      async (
        request: IRequest<
          unknown,
          {
            entityIds: string[];
            resourceEntityId: string;
            valueEntityId?: string;
            valueLabel?: string;
          }
        >
      ) => {
        const { entityIds, resourceEntityId, valueEntityId, valueLabel } = request.body;

        if (
          !entityIds ||
          !Array.isArray(entityIds) ||
          entityIds.length === 0 ||
          !resourceEntityId
        ) {
          throw new BadParams("entityIds array and resourceEntityId must be provided");
        }

        await request.db.lock();

        const entities = await Entity.findEntitiesByIds(request.db.connection, entityIds);

        if (entities.length === 0) {
          throw new EntityDoesNotExist("none of the provided entities were found", entityIds[0]);
        }

        const user = request.getUserOrFail();
        const errors: Record<string, string> = {};
        let updated = 0;

        for (const entityData of entities) {
          let valueId = valueEntityId || "";

          // a V is an endpoint - the "40" of one entity is not the "40" of the
          // next - so a labelled batch gives every entity a V of its own
          if (valueLabel) {
            // the V is written before the entity that will hold it, so an
            // entity the user may not edit must not leave one behind
            if (!getEntityClass({ ...entityData }).canBeEditedByUser(user)) {
              errors[entityData.id] = "permission denied";
              continue;
            }

            const valueModel = getEntityClass({
              id: randomUUID(),
              class: EntityEnums.Class.Value,
              labels: [valueLabel],
              detail: "",
              language: user.options.defaultLanguage,
              data: {},
              notes: [],
              props: [],
              references: [],
              status: EntityEnums.Status.Approved,
              isTemplate: false,
            });

            if (!valueModel.isValid()) {
              errors[entityData.id] = "value model not valid";
              continue;
            }

            if (!valueModel.canBeCreatedByUser(user)) {
              errors[entityData.id] = "permission denied";
              continue;
            }

            await valueModel.beforeSave(request.db.connection);

            if (!(await valueModel.save(request.db.connection))) {
              errors[entityData.id] = "value could not be created";
              continue;
            }

            await Audit.createNew(
              request,
              AuditScope.Entity,
              valueModel.id,
              valueModel,
              EventType.CREATE
            );
            valueId = valueModel.id;
          }

          const newRef: IReference = {
            id: randomUUID(),
            resource: resourceEntityId,
            value: valueId,
          };

          const updatedRefs = [...entityData.references, newRef];
          const updateData: Partial<IEntity> = { references: updatedRefs };

          const model = getEntityClass({
            ...mergeDeep(entityData, updateData),
            class: entityData.class,
            id: entityData.id,
          });

          if (!model.isValid()) {
            errors[entityData.id] = "model not valid";
            continue;
          }

          if (!model.canBeEditedByUser(user)) {
            errors[entityData.id] = "permission denied";
            continue;
          }

          await model.beforeSave(request.db.connection);
          const result = await model.update(request.db.connection, updateData);

          if (result.replaced || result.unchanged) {
            await Audit.createNew(request, AuditScope.Entity, entityData.id, updateData, EventType.EDIT);
            updated++;
          } else {
            errors[entityData.id] = "update failed";
          }
        }

        return {
          result: updated > 0,
          message: `Updated ${updated}/${entities.length} entities${
            Object.keys(errors).length ? `. Errors: ${JSON.stringify(errors)}` : ""
          }`,
        };
      }
    )
  )

  .post(
    "/batchAddRelation",
    asyncRouteHandler<IResponseGeneric>(
      async (
        request: IRequest<
          unknown,
          {
            entityIds: string[];
            relationType: string;
            targetEntityId: string;
          }
        >
      ) => {
        const { entityIds, relationType, targetEntityId } = request.body;

        if (
          !entityIds ||
          !Array.isArray(entityIds) ||
          entityIds.length === 0 ||
          !relationType ||
          !targetEntityId
        ) {
          throw new BadParams("entityIds, relationType and targetEntityId must be provided");
        }

        // BatchTypes holds the types whose save lifecycle touches nothing but
        // the relation being saved, which is what lets the whole run share one
        // RelationSaveContext. Cloud types (Synonym) merge and delete sibling
        // relations as they go and are not among them.
        if (!RelationEnums.BatchTypes.includes(relationType as RelationEnums.Type)) {
          throw new BadParams(`relation type ${relationType} cannot be added in batch`);
        }

        await request.db.lock();

        const entities = await Entity.findEntitiesByIds(request.db.connection, entityIds);

        if (entities.length === 0) {
          throw new EntityDoesNotExist("none of the provided entities were found", entityIds[0]);
        }

        const targetEntity = await findEntityById(request.db, targetEntityId);
        if (!targetEntity) {
          throw new EntityDoesNotExist("target entity was not found", targetEntityId);
        }

        const user = request.getUserOrFail();
        const errors: Record<string, string> = {};
        let created = 0;

        // every relation created below shares one type, so beforeSave can work
        // off a single shared context instead of scanning the relations table
        // per entity
        const saveContext = await Relation.buildSaveContext(
          request.db.connection,
          relationType as RelationEnums.Type
        );

        for (const entityData of entities) {
          try {
            const model = getRelationClass({
              type: relationType as RelationEnums.Type,
              entityIds: [entityData.id, targetEntityId],
            });

            if (!model.isValid()) {
              errors[entityData.id] = "relation not valid for this entity type";
              continue;
            }

            // both sides are already loaded above - no need to re-query per entity
            model.entities = [entityData, targetEntity];

            if (!model.canBeCreatedByUser(user)) {
              errors[entityData.id] = "permission denied";
              continue;
            }

            await model.beforeSave(request, saveContext);

            if (!(await model.save(request.db.connection))) {
              errors[entityData.id] = "save failed";
              continue;
            }

            // keep the shared context current so the next iteration's duplicate
            // and cycle checks see this relation
            Relation.registerSavedRelation(saveContext, model);

            await model.afterSave(request);
            created++;
          } catch (e) {
            errors[entityData.id] = e instanceof Error ? e.message : "unknown error";
          }
        }

        return {
          result: created > 0,
          message: `Created ${created}/${entities.length} relations${
            Object.keys(errors).length ? `. Errors: ${JSON.stringify(errors)}` : ""
          }`,
        };
      }
    )
  )

  .post(
    "/batchSetAttribute",
    asyncRouteHandler<IResponseGeneric>(
      async (
        request: IRequest<
          unknown,
          {
            entityIds: string[];
            changes: IBatchSetAttributeChanges;
          }
        >
      ) => {
        const { entityIds, changes } = request.body;

        if (!entityIds || !Array.isArray(entityIds) || entityIds.length === 0) {
          throw new BadParams("entityIds array must be provided");
        }

        if (!changes || (changes.attribute !== "language" && changes.attribute !== "pos")) {
          throw new BadParams("changes.attribute must be language or pos");
        }

        if (changes.attribute === "language" && changes.to === undefined) {
          throw new BadParams("changes.to must be provided");
        }

        if (changes.attribute === "pos" && !changes.concept && !changes.action) {
          throw new BadParams("changes.concept or changes.action must be provided");
        }

        await request.db.lock();

        const entities = await Entity.findEntitiesByIds(request.db.connection, entityIds);

        if (entities.length === 0) {
          throw new EntityDoesNotExist("none of the provided entities were found", entityIds[0]);
        }

        const user = request.getUserOrFail();
        const errors: Record<string, string> = {};
        let updated = 0;
        // an entity the attribute does not apply to, or whose current value is
        // not the one being replaced, is left alone - not an error
        let skipped = 0;

        for (const entityData of entities) {
          let updateData: Partial<IEntity> | undefined;

          if (changes.attribute === "language") {
            const current = entityData.language || EntityEnums.Language.Empty;
            if (changes.from !== null && current !== changes.from) {
              skipped++;
              continue;
            }
            if (current === changes.to) {
              skipped++;
              continue;
            }
            updateData = { language: changes.to };
          } else {
            const spec =
              entityData.class === EntityEnums.Class.Concept
                ? changes.concept
                : entityData.class === EntityEnums.Class.Action
                  ? changes.action
                  : undefined;

            if (!spec) {
              skipped++;
              continue;
            }

            const current = (entityData.data as { pos?: string })?.pos || "";
            if (spec.from !== null && current !== spec.from) {
              skipped++;
              continue;
            }
            if (current === spec.to) {
              skipped++;
              continue;
            }
            updateData = { data: { ...entityData.data, pos: spec.to } } as Partial<IEntity>;
          }

          const model = getEntityClass({
            ...mergeDeep(entityData, updateData),
            class: entityData.class,
            id: entityData.id,
          });

          if (!model.isValid()) {
            errors[entityData.id] = "model not valid";
            continue;
          }

          if (!model.canBeEditedByUser(user)) {
            errors[entityData.id] = "permission denied";
            continue;
          }

          await model.beforeSave(request.db.connection);
          const result = await model.update(request.db.connection, updateData);

          if (result.replaced || result.unchanged) {
            await Audit.createNew(request, AuditScope.Entity, entityData.id, updateData, EventType.EDIT);
            updated++;
          } else {
            errors[entityData.id] = "update failed";
          }
        }

        return {
          result: updated > 0,
          message: `Updated ${updated}/${entities.length} entities${
            skipped ? ` (${skipped} skipped: not relevant / no match)` : ""
          }${Object.keys(errors).length ? `. Errors: ${JSON.stringify(errors)}` : ""}`,
        };
      }
    )
  )

  /**
   * @openapi
   * /entities/batch:
   *   post:
   *     description: Get multiple entities by their IDs (POST method for large arrays)
   *     tags:
   *       - entities
   *     requestBody:
   *       description: Array of entity IDs
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               ids:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Returns array of entity entries
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/IResponseEntity"
   */
  .post(
    "/batch",
    asyncRouteHandler<IResponseEntity[]>(async (request: IRequest<any, { ids: string[] }>) => {
      const { ids } = request.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new BadParams("ids array must be provided");
      }

      const entities = await Entity.findEntitiesByIds(request.db.connection, ids);

      if (!entities || entities.length === 0) {
        return [];
      }

      const responses = await Promise.all(
        entities.map(async (entityData) => {
          const entity = getEntityClass({ ...entityData });
          const response = new ResponseEntity(entity);
          await response.prepare(request);
          return response;
        })
      );

      // stamp document anchor spans onto statement results so tags can show
      // them as labels (response-only field, see IEntity.anchorTexts). Must
      // run on the wrapped responses - getEntityClass drops undeclared fields.
      await Entity.applyAnchorTexts(request.db.connection, responses);

      return responses;
    })
  );

const parseColumnValue = (columnValue: string | IEntity | number | string | IUser) => {
  if (typeof columnValue === "string") {
    return columnValue;
  }
  if (typeof columnValue === "number") {
    return `${columnValue}`;
  }
  if ("class" in columnValue && "labels" in columnValue) {
    return `(${columnValue.class}):${columnValue.labels[0]}[${columnValue.id}]`;
  }
  if (columnValue instanceof User) {
    return columnValue.name;
  } else {
    return "unknown value";
  }
};
