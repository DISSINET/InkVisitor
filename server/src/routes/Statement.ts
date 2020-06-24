import { Request, Response, Router } from "express";
import { BAD_REQUEST, CREATED, OK, NOT_FOUND } from "http-status-codes";

import {
  IStatement,
  Statement,
  IStatementRepository,
} from "../domain/models/Statement";
import { StatementRepository } from "../service/StatementRepository";
// import { v4 as uuid4 } from 'uuid';
import { ExceptionHandler } from "winston";
import { paramMissingError } from "@shared/constants";

import { IEntity } from "../domain/common/Entity";
import { IRepository } from "../domain/common/Repository";

// >>> Move to standalone file.
class Controller<T> {
  private _repository: IRepository<T>;

  constructor(repository: IRepository<T>) {
    this._repository = repository;
  }

  /**
   * Get the HTTP status code and JSON result.
   */
  static result(
    response: Response,
    code: number,
    message: string | IStatement | IStatement[] //IEntity | IEntity[] | string
  ) {
    return response.status(code).json(message);
  }
}
// <<<

class StatementController extends Controller<IStatement> {
  async create(request: Request, response: Response): Promise<void> {
    // TODO
  }

  async update(request: Request, response: Response): Promise<void> {
    // TODO
  }

  async delete(request: Request, response: Response): Promise<void> {
    // TODO
  }
}

const router = Router();
const repository = new StatementRepository();

/**
 * Create the entity.
 */
router.post("/", async (request: Request, response: Response) => {
  const { statement } = request.body;

  if (!statement) {
    return response.status(BAD_REQUEST).json({
      error: paramMissingError,
    });
  }

  await repository.insertOne(statement);

  return response.status(CREATED).end();
});

/**
 * Delete the entity.
 */
router.delete("/:uuid", async (request: Request, response: Response) => {
  const uuid: string = request.params.uuid;
  await repository.removeOne(uuid);
  return Controller.result(response, OK, `Entity ${uuid} was not deleted.`);
});

/**
 * Get the entity details.
 */
router.get("/", async (request: Request, response: Response) => {
  const filters = request.query; //.filter( (x) => !(x in ["offset", "limit"]) )
  const statements = await repository.findAll(100, 0, filters);
  return Controller.result(response, OK, statements);
});

/**
 *  Get the entity detail.
 */
router.get("/:uuid", async (request: Request, response: Response) => {
  const uuid: string = request.params.uuid;
  const entity: IStatement | undefined = await repository.findOne(uuid);
  return entity
    ? Controller.result(response, OK, entity)
    : Controller.result(response, NOT_FOUND, `Entity ${uuid} was not found.`);
});

export default router;
