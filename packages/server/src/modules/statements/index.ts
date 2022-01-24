import { Request } from "express";
import { Router } from "express";
import { findActantById } from "@service/shorthands";
import {
  BadParams,
  PermissionDeniedError,
  StatementDoesNotExits,
} from "@shared/types/errors";
import { asyncRouteHandler } from "..";
import { IResponseStatement, IStatement } from "@shared/types";
import Statement from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";

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

    const response = new ResponseStatement(statementData);
    await response.prepare(request);

    return response;
  })
);
