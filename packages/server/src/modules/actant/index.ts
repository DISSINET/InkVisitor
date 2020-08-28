import { getOneActant, Result } from "../index";

import { rethinkConfig } from "@service/RethinkDB";
import { paramMissingError } from "@shared/constants";
import { Router, Response, Request, NextFunction } from "express";
import { BAD_REQUEST, CREATED, OK, NOT_FOUND } from "http-status-codes";

import { r } from "rethinkdb-ts";

//-----------------------------------------------------------------------------
// Repository functions
//-----------------------------------------------------------------------------
const TABLE_NAME = "actants";
const CLASS_NAME = "E";

/**
 * RethinkDB actant load function.
 */
async function findOne(actantId: string): Promise<any> {
  return await getOneActant(actantId, CLASS_NAME);
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

  console.log(filters);

  const baseFilterKeys = ["label", "class"];

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

  await r.table(TABLE_NAME).insert(actant).run(conn);

  conn.close();
}

/**
 * Update actant.
 */
async function updateOne(actant: any): Promise<any> {
  let conn = await r.connect(rethinkConfig);

  let result = await r.table(TABLE_NAME).get(actant.id).update(actant);
  conn.close();

  return result;
}

/**
 * RethinkDB actant save function.
 * @param actantId
 */
async function deleteOne(actantId: string): Promise<any> {
  let conn = await r.connect(rethinkConfig);

  console.log(actantId);

  const result = await r.table(TABLE_NAME).get(actantId).delete().run(conn);

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
   * Create the actant.
   */
  .post(
    "/",
    async (request: Request, response: Response, next: NextFunction) => {
      const actant = request.body;

      if (!actant) {
        return response.status(BAD_REQUEST).json({
          error: paramMissingError,
        });
      }

      await saveOne(actant);

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

      if (!actant) {
        return response.status(BAD_REQUEST).json({
          error: paramMissingError,
        });
      }

      const result_ = await saveOne(actant);

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
   * Retrieve data for a given territory id
   * TODO: check async functions
   * TODO: apply types
   * TODO: validate outcomes, throw exceptions, create messages on problem
   */
  .get(
    "/territory/:territoryId",
    async (request: Request, response: Response) => {
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

        for (var si = 0; si < statements.length; si++) {
          const statement = statements[si];

          // 4.1 find action for all statements
          statement.data.action = await r
            .table("actions")
            .get(statement.data.action)
            .run(conn);

          // 4.2 find references for all statements
          for (var ri = 0; ri < statement.data.references.length; ri++) {
            const resourceId = statement.data.references[ri].resource;
            statement.data.references[ri].resource = await r
              .table(TABLE_NAME)
              .get(resourceId)
              .run(conn);
          }

          // 4.3 find tags for all statements
          const tags = [];
          for (var ti = 0; ti < statement.data.tags.length; ti++) {
            const tagId = statement.data.tags[ti];
            const tag = await r.table(TABLE_NAME).get(tagId).run(conn);
            tags.push(tag);
          }
          statement.data.tags = tags;

          // 4.4 find actants for all statements
          for (var ai = 0; ai < statement.data.actants.length; ai++) {
            const actantId = statement.data.actants[ai].actant;
            statement.data.actants[ai].actant = await r
              .table(TABLE_NAME)
              .get(actantId)
              .run(conn);
          }

          // 4.5 find props and actants for all statements
          for (var pi = 0; pi < statement.data.props.length; pi++) {
            statement.data.props[pi].actant1 = await r
              .table(TABLE_NAME)
              .get(statement.data.props[pi].actant1)
              .run(conn);
            statement.data.props[pi].actant2 = await r
              .table(TABLE_NAME)
              .get(statement.data.props[pi].actant2)
              .run(conn);
            statement.data.props[pi].subject = await r
              .table(TABLE_NAME)
              .get(statement.data.props[pi].subject)
              .run(conn);
          }
        }
        territory.statements = statements;

        conn.close();
        return Result(response, OK, territory);
      } else {
        conn.close();
        return Result(
          response,
          NOT_FOUND,
          `Territory ${territoryId} not found.`
        );
      }
    }
  )

  /**
   * Retrieve the actants collection based on filters
   */
  .get("/actants", async (request: Request, response: Response) => {
    const filters = request.query; //.filter( (x) => !(x in ["offset", "limit"]) )
    const actants = await findAll(100, 0, filters);

    console.log("getting actants");
    return Result(response, OK, actants);
  })

  /**
   * Retrieve the actant individual.
   */
  .get("/:uuid", async (request: Request, response: Response) => {
    const uuid: string = request.params.uuid;

    console.log(uuid);

    const actant: any | null = await findOne(uuid);

    return actant
      ? Result(response, OK, actant)
      : Result(response, NOT_FOUND, `Actant ${uuid} was not found.`);
  });
