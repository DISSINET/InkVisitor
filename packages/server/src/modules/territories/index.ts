import { getOneActant, Result } from "../index";

import { rethinkConfig } from "@service/RethinkDB";
import {
  BadParams,
  StatementDoesNotExits,
  TerritoryDoesNotExits,
  StatementInvalidMove,
} from "@common/errors";
import { Router, Response, Request, NextFunction } from "express";
import { asyncRouteHandler } from "..";
import { findActantById, updateActant, findActants } from "@service/shorthands";
import {
  ITerritory,
  IResponseTerritory,
  IStatement,
  IResponseGeneric,
} from "@shared/types";

function insertIStatementToChilds(
  array: IStatement[],
  onIndex: number,
  item: IStatement
): IStatement[] {
  return [...array.slice(0, onIndex), item, ...array.slice(onIndex)];
}

const sortStatements = (terA: IStatement, terB: IStatement): number =>
  terA.data.territory.order - terB.data.territory.order;

export default Router()
  .get(
    "/get/:territoryId?",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const territoryId = request.params.territoryId;

      if (!territoryId) {
        throw new BadParams("territoryId has to be set");
      }

      const territory = await findActantById<ITerritory>(
        request.db,
        territoryId
      );
      if (!territory) {
        throw new TerritoryDoesNotExits(
          `territory ${territoryId} was not found`
        );
      }

      const out: IResponseTerritory = {
        ...territory,
        statements: (
          await findActants<IStatement>(request.db, { class: "S" })
        ).filter(
          (s) => s.data.territory && s.data.territory.id === territoryId
        ),
        actants: [], // TODO
      };

      response.json(out);
    })
  )
  .post(
    "/moveStatement",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const moveId = request.body.moveId;
      const newIndex = request.body.newIndex;

      if (!moveId || newIndex === undefined) {
        throw new BadParams("moveId/newIndex has be set");
      }

      const statement: IStatement = await findActantById<IStatement>(
        request.db,
        moveId
      );
      if (!statement) {
        throw new StatementDoesNotExits("statement does not exist");
      }

      const territory: ITerritory = await findActantById<ITerritory>(
        request.db,
        statement.data.territory.id
      );
      if (!statement) {
        throw new TerritoryDoesNotExits("territory does not exist");
      }

      const out: IResponseGeneric = {
        result: true,
      };

      let statementsForTerritory = (
        await findActants<IStatement>(request.db, { class: "S" })
      )
        .filter((s) => s.data.territory.id === territory.id)
        .sort(sortStatements);
      if (newIndex < 0 || newIndex > statementsForTerritory.length) {
        throw new StatementInvalidMove(
          "cannot move statement to invalid index"
        );
      }

      const currentIndex = statementsForTerritory.findIndex(
        (s) => s.id === moveId
      );
      if (currentIndex === -1) {
        // statement is not present in the array
        throw new StatementInvalidMove("statement not present in the array");
      }
      if (currentIndex === newIndex) {
        out.result = false;
        out.message = "already on the new index";
        return response.json(out);
      }
      statementsForTerritory.splice(currentIndex, 1);

      statementsForTerritory = insertIStatementToChilds(
        statementsForTerritory,
        newIndex,
        statement
      );

      for (let i = 0; i < statementsForTerritory.length; i++) {
        const statement = statementsForTerritory[i];
        statement.data.territory.order = i + 1;
        await updateActant(request.db, statement.id, statement);
      }

      response.json(out);
    })
  );
