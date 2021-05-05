import {
  BadParams,
  StatementDoesNotExits,
  TerritoryDoesNotExits,
  StatementInvalidMove,
} from "@shared/types/errors";
import { Router, Request } from "express";
import { asyncRouteHandler } from "..";
import { findActantById, findActants } from "@service/shorthands";
import {
  ITerritory,
  IResponseTerritory,
  IStatement,
  IResponseGeneric,
  IActant,
} from "@shared/types";
import Statement from "@models/statement";

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
    asyncRouteHandler<IResponseTerritory>(async (request: Request) => {
      const territoryId = request.params.territoryId;
      if (!territoryId) {
        throw new BadParams("territoryId has to be set");
      }

      const territory = await findActantById<ITerritory>(
        request.db,
        territoryId,
        {
          class: "T",
        }
      );
      if (!territory) {
        throw new TerritoryDoesNotExits(
          `territory ${territoryId} was not found`
        );
      }

      const statements: IStatement[] = (
        await findActants<IStatement>(request.db, { class: "S" })
      )
        .filter((s) => s.data.territory && s.data.territory.id === territoryId)
        .sort((a, b) => {
          return a.data.territory.order - b.data.territory.order;
        });

      const actants: IActant[] = [];

      for (const actantId of Statement.getDependencyListForMany(statements)) {
        const actant = await findActantById<IActant>(request.db, actantId);
        if (actant) {
          actants.push(actant);
        }
      }

      return {
        ...territory,
        statements,
        actants,
      };
    })
  )
  .get(
    "/getActantIds/:territoryId?",
    asyncRouteHandler<string[]>(async (request: Request) => {
      const territoryId = request.params.territoryId;
      if (!territoryId) {
        throw new BadParams("territoryId has to be set");
      }

      const territory = await findActantById<ITerritory>(
        request.db,
        territoryId,
        {
          class: "T",
        }
      );
      if (!territory) {
        throw new TerritoryDoesNotExits(
          `territory ${territoryId} was not found`
        );
      }

      const statements: IStatement[] = (
        await findActants<IStatement>(request.db, { class: "S" })
      )
        .filter((s) => s.data.territory && s.data.territory.id === territoryId)
        .sort((a, b) => {
          return a.data.territory.order - b.data.territory.order;
        });

      const actantIds = Statement.getDependencyListForMany(statements);

      // const dependentStatementIds: string[] = await Statement.findDependentStatementIds(
      //   request.db.connection,
      //   territoryId
      // );

      return actantIds;
    })
  )
  .post(
    "/moveStatement",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
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
      if (!territory) {
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
        throw new StatementInvalidMove("already on the position");
      }
      statementsForTerritory.splice(currentIndex, 1);

      statementsForTerritory = insertIStatementToChilds(
        statementsForTerritory,
        newIndex,
        statement
      );

      for (let i = 0; i < statementsForTerritory.length; i++) {
        const statement = new Statement({ ...statementsForTerritory[i] });
        statement.data.territory.order = i + 1;
        await statement.update(request.db.connection, { data: statement.data });
      }

      return out;
    })
  );
