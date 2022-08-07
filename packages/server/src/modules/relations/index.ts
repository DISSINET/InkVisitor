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
  RelationDoesNotExist,
} from "@shared/types/errors";
import Relation from "@models/relation/relation";
import { Request, Router } from "express";
import { asyncRouteHandler } from "../index";
import { ResponseSearch } from "@models/entity/response-search";
import { IRequestSearch } from "@shared/types/request-search";

export default Router()
  .post(
    "/",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const model = new Relation(request.body as Record<string, unknown>);

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
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot create relation`);
      }
    })
  )
  .put(
    "/:relationId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const id = request.params.relationId;
      const data = request.body as Record<string, unknown>;

      if (!id || !data || Object.keys(data).length === 0) {
        throw new BadParams("relation id and data have to be set");
      }

      const existing = await Relation.getById(request, id);
      if (!existing) {
        throw RelationDoesNotExist.forId(id);
      }

      const model = new Relation(data);
      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      if (!model.canBeEditedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("relation cannot be saved");
      }

      const result = await model.update(request.db.connection, data);

      if (result.replaced || result.unchanged) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot update relation ${id}`);
      }
    })
  );
