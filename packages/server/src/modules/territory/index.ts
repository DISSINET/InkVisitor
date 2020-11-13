import { getOneActant, Result } from "../index";

import { rethinkConfig } from "@service/RethinkDB";
import { paramMissingError } from "@common/constants";
import { Router, Response, Request, NextFunction } from "express";
import { BAD_REQUEST, CREATED, OK, NOT_FOUND } from "http-status-codes";

import { r } from "rethinkdb-ts";

//-----------------------------------------------------------------------------
// Repository functions
//-----------------------------------------------------------------------------
const TABLE_NAME = "actants";

//-----------------------------------------------------------------------------
// Router
//-----------------------------------------------------------------------------

export default Router()
  /**
   * Retrieve data for a given territory id
   */
  .get("/:territoryId", async (request: Request, response: Response) => {
    let conn = await r.connect(rethinkConfig);
    const territoryId: string = request.params.territoryId;

    // 1. find territory in actants
    const territory = await r.table(TABLE_NAME).get(territoryId).run(conn);

    if (territory) {
      // 2. find all child territories
      const childTerritories = await r
        .table(TABLE_NAME)
        .filter({ data: { parent: territoryId } })
        .run(conn);
      territory.children = childTerritories;

      // 3. find parent territory
      territory.parent = territory.data.parent
        ? await r.table(TABLE_NAME).get(territory.data.parent).run(conn)
        : false;

      // 4. find all statements in this territory
      const statements = await r
        .table(TABLE_NAME)
        .filter({ data: { territory: territoryId } })
        .run(conn);

      // 4.2 find references for all statements
      const referenceIds: any[] = [];
      statements.forEach((statement) => {
        statement.data.references.forEach((resource: any) =>
          referenceIds.push(resource.resource)
        );
      });

      // 4.3 find tags for all statements
      const tagIds: any[] = [];
      statements.forEach((statement) => {
        statement.data.tags.forEach((tagId: any) => tagIds.push(tagId));
      });

      // 4.4 find actants for all statements
      const statementActantIds: any[] = [];
      statements.forEach((statement) => {
        statement.data.actants.forEach((actant: any) =>
          statementActantIds.push(actant.actant)
        );
      });

      // 4.5 find actants from props for all statements
      const propActantIds: any[] = [];
      statements.forEach((statement) => {
        statement.data.props.forEach((prop: any) => {
          propActantIds.push(prop.actant1);
          propActantIds.push(prop.actant2);
        });
      });
      territory.statements = statements;

      const allActantIds = [
        ...new Set([
          ...statementActantIds,
          ...tagIds,
          ...referenceIds,
          ...propActantIds,
        ]),
      ].filter((a) => a);

      //console.log("allActantIds", allActantIds);

      territory.actants = await r
        .table("actants")
        .getAll(...allActantIds)
        .run(conn);

      conn.close();
      return Result(response, OK, territory);
    } else {
      conn.close();
      return Result(response, NOT_FOUND, `Territory ${territoryId} not found.`);
    }
  });
