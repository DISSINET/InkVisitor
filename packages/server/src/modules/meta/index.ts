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
    const actions = await r.table("actions").run(conn);
    const meta = {
      actions,
    };

    return Result(response, OK, meta);
  });
