import { getOneActant, Result } from "../index";
import { rethinkConfig } from "@service/RethinkDB";
import { paramMissingError } from "@common/constants";
import { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "http-status-codes";
import { r } from "rethinkdb-ts";

//-----------------------------------------------------------------------------
// Repository functions
//-----------------------------------------------------------------------------
const TABLE_NAME = "actants";
const CLASS_NAME = "S";

/**
 * RethinkDB entity load function.
 */
async function findOne(statementId: string): Promise<any> {
  return await getOneActant(statementId, CLASS_NAME);
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
async function saveOne(statement: any): Promise<any> {
  let conn = await r.connect(rethinkConfig);

  await r.table(TABLE_NAME).insert(statement).run(conn);

  conn.close();
}

/**
 * Update entity.
 */
async function updateOne(statement: any): Promise<any> {
  let conn = await r.connect(rethinkConfig);

  let result = await r.table(TABLE_NAME).get(statement.id).update(statement);

  conn.close();

  return result;
}

/**
 * RethinkDB entity save function.
 * @param entity
 * @param version
 */
async function deleteOne(statementId: string): Promise<any> {
  let conn = await r.connect(rethinkConfig);

  console.log(statementId);

  const result = await r.table(TABLE_NAME).get(statementId).delete().run(conn);

  conn.close();

  return result;
}

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
      const statement = request.body;

      if (!statement) {
        return response.status(BAD_REQUEST).json({
          error: paramMissingError,
        });
      }

      await saveOne(statement);

      return response.status(CREATED).json(statement).end();
    }
  )

  /**
   * Update the entity.
   */
  .put(
    "/:uuid",
    async (request: Request, response: Response, next: NextFunction) => {
      const statement = request.body;

      if (!statement) {
        return response.status(BAD_REQUEST).json({
          error: paramMissingError,
        });
      }

      const result_ = await saveOne(statement);

      console.log(`UPDATE ${result_}`);

      return result_
        ? response.status(OK).json(statement).end()
        : Result(response, NOT_FOUND, `Entity ${statement.id} not found`);
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
    const statements = await findAll(100, 0);

    return Result(response, OK, statements);
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
