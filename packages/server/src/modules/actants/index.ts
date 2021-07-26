import { asyncRouteHandler } from "../index";
import { Router, Request } from "express";
import {
  findActantById,
  findActantsByLabelOrClass,
  createActant,
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
} from "@shared/types/errors";
import {
  IActant,
  IResponseDetail,
  IResponseGeneric,
  IResponseStatement,
  IResponseActant,
  IResponseSearch,
  RequestSearch,
  IStatement,
} from "@shared/types";

import Statement from "@models/statement";
import { IDbModel } from "@models/common";

export default Router()
  .get(
    "/get/:actantId?",
    asyncRouteHandler<IResponseActant>(async (request: Request) => {
      const actantId = request.params.actantId;

      if (!actantId) {
        throw new BadParams("actantId has to be set");
      }

      const actant = await findActantById<IActant>(
        request.db,
        actantId as string
      );

      if (!actant) {
        throw new ActantDoesNotExits(`actant ${actantId} was not found`);
      }

      const usedInStatements = await Statement.findDependentStatements(
        request.db.connection,
        actant.id
      );

      return {
        ...actant,
        usedCount: usedInStatements.length,
        usedIn: usedInStatements,
      };
    })
  )
  .post(
    "/getMore",
    asyncRouteHandler<IResponseActant[]>(async (request: Request) => {
      const label = request.body.label;
      const classParam = request.body.class;

      if (!label && !classParam) {
        throw new BadParams("label or class has to be set");
      }

      return await findActantsByLabelOrClass(request.db, label, classParam);
    })
  )
  .post(
    "/create",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const model = getActantType(request.body as Record<string, unknown>);
      if (!model) {
        throw new BadParams("actant data have to be set");
      }

      const result = await createActant(request.db, model);

      if (result.inserted === 1) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError("cannot create actant");
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
          `actant with id ${actantId} does not exist`
        );
      }

      let model: IDbModel | null = null;

      try {
        // get correct IDbModel implementation
        model = getActantType({
          ...actantData,
          class: existingActant.class,
          id: actantId,
        });
      } catch (e) {
        throw new ModelNotValidError(e.toString);
      }

      // class is from the db, so it must work, unless bad data
      if (!model) {
        throw new Error("internal error");
      }

      // checking the validity of the final model (already has updated data)
      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      // update only the required fields
      const result = await model.update(request.db.connection, actantData);

      if (result.replaced) {
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
          `actant with id ${actantId} does not exist`
        );
      }

      // get correct IDbModel implementation
      const model = getActantType({
        class: existingActant.class,
        id: actantId,
      });

      // class is from the db, so it must work, unless bad data
      if (!model) {
        throw new Error("internal error");
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

      const actant = await findActantById<IActant>(request.db, actantId);
      if (!actant) {
        throw new ActantDoesNotExits(`actant ${actantId} was not found`);
      }

      const meta: IResponseStatement[] = [];

      const statements = await Statement.findMetaStatements(
        request.db.connection,
        actant.id
      );

      for (const statement of statements) {
        const metaActants = await findActantsByIds(
          request.db,
          statement.getDependencyList()
        );

        meta.push({
          ...statement,
          actants: metaActants,
        });
      }

      const usedInStatements = await Statement.findDependentStatements(
        request.db.connection,
        actant.id
      );

      return {
        ...actant,
        usedCount: usedInStatements.length,
        usedIn: usedInStatements,
        metaStatements: meta,
      };
    })
  )
  .post(
    "/search",
    asyncRouteHandler<IResponseSearch[]>(async (httpRequest: Request) => {
      const req = new RequestSearch(httpRequest.body);

      const err = req.validate();
      if (err) {
        throw err;
      }

      let associatedActantIds: string[] | undefined = undefined;
      if (req.actantId || req.actionId) {
        associatedActantIds = await findAssociatedActantIds(
          httpRequest.db,
          req.actantId,
          req.actionId
        );
      }

      if (associatedActantIds && !associatedActantIds.length) {
        return [];
      }

      const actants = await filterActantsByWildcard(
        httpRequest.db,
        req.class,
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
