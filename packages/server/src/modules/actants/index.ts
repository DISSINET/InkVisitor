import { asyncRouteHandler } from "../index";
import { Router, Request } from "express";
import {
  findActantById,
  findActantsByIds,
  findAssociatedActantIds,
  filterActantsByWildcard,
} from "@service/shorthands";
import { getActantType } from "@models/factory";
import {
  BadParams,
  ActantDoesNotExits,
  ModelNotValidError,
  InternalServerError,
  PermissionDeniedError,
} from "@shared/types/errors";
import {
  IActant,
  IResponseDetail,
  IResponseGeneric,
  IResponseStatement,
  IResponseActant,
  IResponseSearch,
  RequestSearch,
} from "@shared/types";
import { mergeDeep } from "@common/functions";
import Statement from "@models/statement";
import { ActantStatus, ActantType, UserRole } from "@shared/enums";
import Audit from "@models/audit";
import { Connection } from "rethinkdb-ts";

export default Router()
  .get(
    "/get/:actantId?",
    asyncRouteHandler<IResponseActant>(async (request: Request) => {
      const actantId = request.params.actantId;

      if (!actantId) {
        throw new BadParams("actantId has to be set");
      }

      const actantData = await findActantById<IActant>(
        request.db,
        actantId as string
      );

      if (!actantData) {
        throw new ActantDoesNotExits(
          `actant ${actantId} was not found`,
          actantId
        );
      }
      const actant = getActantType({ ...actantData });

      const usedInStatements = await Statement.findDependentStatements(
        request.db.connection,
        actant.id as string
      );

      return {
        ...actant,
        usedIn: usedInStatements,
        right: actant.getUserRoleMode(request.getUserOrFail()),
      } as IResponseActant;
    })
  )
  .post(
    "/getMore",
    asyncRouteHandler<IResponseActant[]>(async (request: Request) => {
      const label = request.body.label;
      const classParam = request.body.class;
      const excluded: ActantType[] = request.body.excluded;

      if (!label && !classParam) {
        throw new BadParams("label or class has to be set");
      }

      if (
        typeof excluded !== "undefined" &&
        excluded.constructor.name !== "Array"
      ) {
        throw new BadParams("excluded need to be array");
      }

      const actants = await filterActantsByWildcard(
        request.db,
        classParam,
        excluded,
        label
      );

      return actants.map((a) => {
        const actantInstance = getActantType({ ...a });
        return {
          ...a,
          right: actantInstance.getUserRoleMode(request.getUserOrFail()),
        } as IResponseActant;
      });
    })
  )
  .post(
    "/create",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const model = getActantType(request.body as Record<string, unknown>);

      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      const user = request.getUserOrFail();

      if (!model.canBeCreatedByUser(user)) {
        throw new PermissionDeniedError("actant cannot be created");
      }

      if (user.role !== UserRole.Admin) {
        model.status = ActantStatus.Pending;
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
        throw new InternalServerError(`cannot create actant`);
      }
    })
  )
  .put(
    "/update/:actantId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const actantId = request.params.actantId;
      const actantData = request.body as Record<string, unknown>;

      // not validation, just required data for this operation
      if (!actantId || !actantData || Object.keys(actantData).length === 0) {
        throw new BadParams("actant id and data have to be set");
      }

      // actantId must be already in the db
      const existingActant = await findActantById(request.db, actantId);
      if (!existingActant) {
        throw new ActantDoesNotExits(
          `actant with id ${actantId} does not exist`,
          actantId
        );
      }

      // get correct IDbModel implementation
      const model = getActantType({
        ...mergeDeep(existingActant, actantData),
        class: existingActant.class,
        id: actantId,
      });

      // checking the validity of the final model (already has updated data)
      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      if (!model.canBeEditedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("actant cannot be saved");
      }

      if (request.getUserOrFail().role !== UserRole.Admin) {
        model.status = ActantStatus.Pending;
      }

      // update only the required fields
      const result = await model.update(request.db.connection, actantData);

      if (result.replaced || result.unchanged) {
        await Audit.createNew(
          request.db.connection,
          request.getUserOrFail(),
          actantId,
          actantData
        );

        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot update actant ${actantId}`);
      }
    })
  )
  .delete(
    "/delete/:actantId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const actantId = request.params.actantId;

      if (!actantId) {
        throw new BadParams("actant id has to be set");
      }

      // actantId must be already in the db
      const existingActant = await findActantById(request.db, actantId);
      if (!existingActant) {
        throw new ActantDoesNotExits(
          `actant with id ${actantId} does not exist`,
          actantId
        );
      }

      // get correct IDbModel implementation
      const model = getActantType({
        class: existingActant.class,
        id: actantId,
      });

      if (!model.canBeDeletedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("actant cannot be deleted");
      }

      const result = await model.delete(request.db.connection);

      if (result.deleted === 1) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot delete actant ${actantId}`);
      }
    })
  )
  .get(
    "/detail/:actantId?",
    asyncRouteHandler<IResponseDetail>(async (request: Request) => {
      const actantId = request.params.actantId;

      if (!actantId) {
        throw new BadParams("actant id has to be set");
      }

      const actantData = await findActantById(request.db, actantId);
      if (!actantData) {
        throw new ActantDoesNotExits(
          `actant ${actantId} was not found`,
          actantId
        );
      }

      const actant = getActantType({ ...actantData });

      if (!actant.canBeViewedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError(`cannot view actant ${actantId}`);
      }

      const usedInStatements = await Statement.findDependentStatements(
        request.db.connection,
        actant.id
      );

      return {
        ...actant,
        usedIn: usedInStatements,
        entities: await actant.getEntities(request.db.connection as Connection),
        right: actant.getUserRoleMode(request.getUserOrFail()),
      } as IResponseDetail;
    })
  )
  .post(
    "/search",
    asyncRouteHandler<IResponseSearch[]>(async (httpRequest: Request) => {
      const req = new RequestSearch(httpRequest.body);
      if (req.label && req.label.length < 4) {
        return [];
      }

      const err = req.validate();
      if (err) {
        throw err;
      }

      let associatedActantIds: string[] | undefined = undefined;
      if (req.actantId) {
        associatedActantIds = await findAssociatedActantIds(
          httpRequest.db,
          req.actantId
        );

        // actant id provided, but not found within statements - end now
        if (!associatedActantIds.length) {
          return [];
        }
      }

      // filter out duplicates
      associatedActantIds = [...new Set(associatedActantIds)];

      const actants = await filterActantsByWildcard(
        httpRequest.db,
        req.class,
        req.excluded,
        req.label,
        associatedActantIds
      );

      return actants.map((a: IActant) => {
        const out: IResponseSearch = {
          actantId: a.id,
          actantLabel: a.label,
          class: a.class,
        };
        return out;
      });
    })
  );
