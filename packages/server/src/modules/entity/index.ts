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
const CLASS_NAME = "E";

/**
 * RethinkDB entity load function.
 */
async function findOne(entityId: string): Promise<any> {
  return await getOneActant(entityId, CLASS_NAME);
}

/**
 * RethinkDB entity load function.
 */
async function findAll(limit = 100, offset = 0): Promise<any> {
  let conn = await r.connect(rethinkConfig);

  let result = await r
    .table(TABLE_NAME)
    .filter({ class: CLASS_NAME })
    .limit(limit)
    .run(conn);

  conn.close();

  return result;
}

/**
 * RethinkDB entity save function.
 * @param entity
 * @param version
 */
async function saveOne(entity: any): Promise<any> {
  let conn = await r.connect(rethinkConfig);

  await r.table(TABLE_NAME).insert(entity).run(conn);

  conn.close();
}

/**
 * Update entity.
 */
async function updateOne(entity: any): Promise<any> {
  let conn = await r.connect(rethinkConfig);

  let result = await r.table(TABLE_NAME).get(entity.id).update(entity);

  conn.close();

  return result;
}

/**
 * RethinkDB entity save function.
 * @param entity
 * @param version
 */
async function deleteOne(entityId: string): Promise<any> {
  let conn = await r.connect(rethinkConfig);

  console.log(entityId);

  const result = await r.table(TABLE_NAME).get(entityId).delete().run(conn);

  conn.close();

  return result;
}

//-----------------------------------------------------------------------------
// Controller functions
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Router
//-----------------------------------------------------------------------------

export default Router()
  /**
   * Create the entity.
   */
  .post(
    "/",
    async (request: Request, response: Response, next: NextFunction) => {
      const entity = request.body;

      if (!entity) {
        return response.status(BAD_REQUEST).json({
          error: paramMissingError,
        });
      }

      await saveOne(entity);

      return response.status(CREATED).json(entity).end();
    }
  )

  /**
   * Update the entity.
   */
  .put(
    "/:uuid",
    async (request: Request, response: Response, next: NextFunction) => {
      const entity = request.body;

      if (!entity) {
        return response.status(BAD_REQUEST).json({
          error: paramMissingError,
        });
      }

      const result_ = await saveOne(entity);

      console.log(`UPDATE ${result_}`);

      return result_
        ? response.status(OK).json(entity).end()
        : Result(response, NOT_FOUND, `Entity ${entity.id} not found`);
    }
  )

  /**
   * Delete the entity.
   */
  .delete("/:uuid", async (request: Request, response: Response) => {
    const uuid: string = request.params.uuid;

    const result_ = await deleteOne(uuid);

    return result_
      ? Result(response, OK, `Entity ${uuid} was deleted.`)
      : Result(response, NOT_FOUND, `Entity ${uuid} not found.`);
  })
  /**
   * Retrieve the entity collection.
   */
  .get("/", async (request: Request, response: Response) => {
    const filters = request.query; //.filter( (x) => !(x in ["offset", "limit"]) )
    const entitys = await findAll(100, 0);

    return Result(response, OK, entitys);
  })

  /**
   * Retrieve the entity individual.
   */
  .get("/:uuid", async (request: Request, response: Response) => {
    const uuid: string = request.params.uuid;

    console.log(uuid);

    const entity: any | null = await findOne(uuid);

    return entity
      ? Result(response, OK, entity)
      : Result(response, NOT_FOUND, `Entity ${uuid} was not found.`);
  });
