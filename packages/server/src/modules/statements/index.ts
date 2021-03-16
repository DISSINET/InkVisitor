import { Request, Response } from "express";
import { Router } from "express";
import { findActantById } from "@service/shorthands";
import { BadParams, StatementDoesNotExits } from "@common/errors";
import { asyncRouteHandler } from "..";
import { IResponseStatement, IStatement, IActant } from "@shared/types";
import { getActantIdsFromStatements } from "@shared/types/statement";

export default Router().get(
  "/get/:statementId?",
  asyncRouteHandler(async (request: Request, response: Response) => {
    const statementId = request.params.statementId;

    if (!statementId) {
      throw new BadParams("statement id has to be set");
    }

    const statement = await findActantById<IStatement>(request.db, statementId);
    if (!statement) {
      throw new StatementDoesNotExits(`statement ${statementId} was not found`);
    }

    const actants: IActant[] = [];

    for (const actantId of getActantIdsFromStatements([statement])) {
      const actant = await findActantById<IActant>(request.db, actantId);
      if (actant) {
        actants.push(actant);
      }
    }

    const out: IResponseStatement = {
      ...statement,
      actants,
      audits: [],
      usedIn: [],
    };

    response.json(out);
  })
);
