import { Request } from "express";
import { Router } from "express";
import { findActantById } from "@service/shorthands";
import { BadParams, StatementDoesNotExits } from "@shared/types/errors";
import { asyncRouteHandler } from "..";
import { IResponseStatement, IStatement, IActant } from "@shared/types";
import Statement from "@models/statement";

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
      throw new StatementDoesNotExits(`statement ${statementId} was not found`);
    }

    const actants: IActant[] = [];

    const statementModel = new Statement({ ...statementData });
    for (const actantId of statementModel.getDependencyList()) {
      const actant = await findActantById<IActant>(request.db, actantId);
      if (actant) {
        actants.push(actant);
      }
    }

    return {
      ...statementData,
      actants,
      audits: [],
      usedIn: [],
    };
  })
);
