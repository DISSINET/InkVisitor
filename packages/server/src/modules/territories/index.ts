import { getOneActant, Result } from "../index";

import { rethinkConfig } from "@service/RethinkDB";
import { BadParams, TerritoryDoesNotExits } from "@common/errors";
import { Router, Response, Request, NextFunction } from "express";
import { asyncRouteHandler } from "..";
import {
  findActantById,
  findActantsById,
  findActants,
} from "@service/shorthands";
import { ITerritory, IResponseTerritory, IStatement } from "@shared/types";

export default Router().get(
  "/get/:territoryId?",
  asyncRouteHandler(async (request: Request, response: Response) => {
    const territoryId = request.params.territoryId;

    if (!territoryId) {
      throw new BadParams("territoryId has to be set");
    }

    const territory = await findActantById<ITerritory>(request.db, territoryId);
    if (!territory) {
      throw new TerritoryDoesNotExits(`territory ${territoryId} was not found`);
    }

    const out: IResponseTerritory = {
      ...territory,
      statements: (
        await findActants<IStatement>(request.db, { class: "S" })
      ).filter((s) => s.data.territory && s.data.territory.id === territoryId),
      actants: [], // TODO
    };

    response.json(out);
  })
);
