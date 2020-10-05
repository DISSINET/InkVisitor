import { getOneActant, Result } from "../index";
import { rethinkConfig } from "@service/RethinkDB";
import { paramMissingError } from "@common/constants";
import { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "http-status-codes";
import { r } from "rethinkdb-ts";

//-----------------------------------------------------------------------------
// Router
//-----------------------------------------------------------------------------

export default Router()
  /**
   * Retrieve meta information.
   */
  .get("/", async (request: Request, response: Response) => {
    let conn = await r.connect(rethinkConfig);

    const meta = {
      actions: await r.table("actions").run(conn),
      dictionaries: {
        certainties: await r.table("dict_certainties").run(conn),
        elvls: await r.table("dict_elvls").run(conn),
        languages: await r.table("dict_languages").run(conn),
        modalities: await r.table("dict_modalities").run(conn),
        positions: await r.table("dict_positions").run(conn),
        referencetypes: await r.table("dict_referencetypes").run(conn),
        resourcetypes: await r.table("dict_resourcetypes").run(conn),
        territorytypes: await r.table("dict_territorytypes").run(conn),
      },
    };

    return Result(response, OK, meta);
  });
