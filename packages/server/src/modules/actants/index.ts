import { asyncRouteHandler, getOneActant, Result } from "../index";

import { rethinkConfig } from "@service/RethinkDB";
import { paramMissingError } from "@common/constants";
import { Router, Response, Request, NextFunction } from "express";
import { BAD_REQUEST, CREATED, OK, NOT_FOUND } from "http-status-codes";
import { findActantById } from "@service/shorthands";
import {
  BadCredentialsError,
  BadParams,
  ActantDoesNotExits,
} from "@common/errors";
import { r } from "rethinkdb-ts";

//-----------------------------------------------------------------------------
// Repository functions
//-----------------------------------------------------------------------------
const TABLE_NAME = "actants";

/**
 * RethinkDB actant load function.
 */
async function findOne(actantId: string): Promise<any> {
  let conn = await r.connect(rethinkConfig);
  let result = await r.table(TABLE_NAME).get(actantId).run(conn);

  conn.close();

  return result;
}

/**
 * RethinkDB actant load function.
 */
async function findAll(
  limit = 100,
  offset = 0,
  filters: any = {}
): Promise<any> {
  let conn = await r.connect(rethinkConfig);
  const baseFilterKeys = ["class"];

  const dataFilterKeys = [
    "certainty",
    "type",
    "elvl",
    "territory",
    "action",
    "language",
    "link",
    "parent",
  ];

  // construct the filterObject
  const filterObject: any = { data: {} };

  baseFilterKeys.forEach((baseFilterKey) => {
    if (baseFilterKey in filters) {
      filterObject[baseFilterKey] = filters[baseFilterKey];
    }
  });
  dataFilterKeys.forEach((dataFilterKey) => {
    if (dataFilterKey in filters) {
      filterObject["data"][dataFilterKey] = filters[dataFilterKey];
    }
  });

  let result = await r
    .table(TABLE_NAME)
    .filter(filterObject)
    .filter((doc: any) =>
      filters.label
        ? doc.hasFields("data")("label") &&
          doc("data")("label").downcase().match(filters.label.toLowerCase())
        : true
    )
    .limit(limit)
    .run(conn);

  conn.close();

  return result;
}

/**
 * RethinkDB actant save function.
 * @param actant
 */
async function saveOne(actant: any): Promise<any> {
  let conn = await r.connect(rethinkConfig);
  const result = await r.table(TABLE_NAME).insert(actant).run(conn);
  conn.close();

  return result;
}

/**
 * Update actant.
 */
async function updateOne(actant: any): Promise<any> {
  let conn = await r.connect(rethinkConfig);

  let result = await r
    .table(TABLE_NAME)
    .get(actant.id)
    .update(actant)
    .run(conn);

  conn.close();

  return result;
}

/**
 * RethinkDB actant save function.
 * @param actantId
 */
async function deleteOne(actantId: string): Promise<any> {
  let conn = await r.connect(rethinkConfig);
  console.log("deleting actant", actantId);

  const result = await r.table(TABLE_NAME).get(actantId).delete().run(conn);

  conn.close();

  return result;
}

export default Router()
  .get(
    "/get/:actantId?",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const actantId = request.params.actantId;

      if (!actantId) {
        throw new BadParams("actantId has to be set");
      }

      const actant = await findActantById(request.db, actantId as string);
      if (!actant) {
        throw new ActantDoesNotExits(`actant ${actantId} was not found`);
      }

      response.json(actant);
    })
  )
  // old
  .post(
    "/",
    async (request: Request, response: Response, next: NextFunction) => {
      const actant = request.body;

      console.log("creating actant", actant.id);

      if (!actant) {
        return response.status(BAD_REQUEST).json({
          error: paramMissingError,
        });
      }

      const result = await saveOne(actant);

      return response.status(CREATED).json(actant).end();
    }
  )

  /**
   * Update the actant.
   */
  .put(
    "/:uuid",
    async (request: Request, response: Response, next: NextFunction) => {
      const actant = request.body;
      console.log("updating actant", actant.id);

      if (!actant) {
        return response.status(BAD_REQUEST).json({
          error: paramMissingError,
        });
      }

      const result_ = await updateOne(actant);

      console.log(`UPDATE ${result_}`);

      return result_
        ? response.status(OK).json(actant).end()
        : Result(response, NOT_FOUND, `Actant ${actant.id} not found`);
    }
  )

  /**
   * Delete the actant.
   */
  .delete("/:uuid", async (request: Request, response: Response) => {
    const uuid: string = request.params.uuid;
    const result_ = await deleteOne(uuid);

    return result_
      ? Result(response, OK, `Actant ${uuid} was deleted.`)
      : Result(response, NOT_FOUND, `Actant ${uuid} not found.`);
  })

  /**
   * Retrieve the actants collection based on filters
   */
  .get("/query", async (request: Request, response: Response) => {
    const filters = request.query; //.filter( (x) => !(x in ["offset", "limit"]) )
    const actants = await findAll(100, 0, filters);

    console.log("getting actants");
    return Result(response, OK, actants);
  });

/**
 * Retrieve the actant individual.
 */
/*
  .get("/:uuid", async (request: Request, response: Response) => {
    const uuid: string = request.params.uuid;

    console.log("asking for single actant", uuid);

    const actant: any | null = await findOne(uuid);

    return actant
      ? Result(response, OK, actant)
      : Result(response, NOT_FOUND, `Actant ${uuid} was not found.`);
  });
*/
