import { Request } from "express";
import { Router } from "express";
import { findActantById, findActantsByIds } from "@service/shorthands";
import {
  BadParams,
  PermissionDeniedError,
  StatementDoesNotExits,
} from "@shared/types/errors";
import { asyncRouteHandler } from "..";
import { IResponseStatement, IStatement, IActant } from "@shared/types";
import Statement from "@models/statement";
import { Connection } from "rethinkdb-ts";

export default Router().get(
  "/get/:statementId?",
  asyncRouteHandler<IResponseStatement>(async (request: Request) => {
    const statementId = request.params.statementId;

    if (!statementId) {
      throw new BadParams("statement id has to be set");
    }

    const statementData = await findActantById<IStatement>(
      request.db,
      statementId
    );
    if (!statementData) {
      throw new StatementDoesNotExits(
        `statement ${statementId} was not found`,
        statementId
      );
    }

    const statementModel = new Statement({ ...statementData });

    if (!statementModel.canBeViewedByUser(request.getUserOrFail())) {
      throw new PermissionDeniedError("statement cannot be accessed");
    }

    return {
      ...statementData,
      entities: await statementModel.getEntities(
        request.db.connection as Connection
      ),
      right: statementModel.getUserRoleMode(request.getUserOrFail()),
    };
  })
);
