import { IStatement, Statement } from "../domain/models/Statement";
import { IRepository } from "../domain/common";
import * as statementMocks from "../../../database/import/import_data/mock/statements.json";

export interface IStatementRepository extends IRepository<IStatement> {}

/**
 * The statement entity in-memory repository.
 */
export class StatementRepository implements IStatementRepository {
  private statements: Map<string, IStatement>;

  constructor() {
    this.statements = new Map(
      Object.values(statementMocks).map((_: IStatement) => [
        _.id,
        new Statement(
          _.id,
          _.tree,
          _.territoryId,
          _.resources,
          _.actionId,
          _.modality,
          _.certainty,
          _.epistemicLevel,
          _.tags,
          _.note,
          _.meta,
          _.text
        ),
      ])
    );
  }

  async insertOne(entity: IStatement): Promise<void> {
    // if statement in statements raise exception.
    this.statements.set(entity.id, entity);
  }

  async removeOne(entityId: string): Promise<void> {
    if (!(entityId in this.statements)) {
      throw new Error(`Entity ${entityId} not found.`);
    }
    this.statements.delete(entityId);
  }

  async findAll(
    limit: number,
    offset: number,
    filters = {}
  ): Promise<IStatement[]> {
    const result = [...this.statements.values()];

    if ("territoryId" in filters) {
      // Only territoryId implemented.
      return result.filter((_) => filters["territoryId"] === _.territoryId);
    }
    return result;
  }

  async findOne(entityId: string /*UUID*/): Promise<Statement | undefined> {
    return [...this.statements.values()].find(({ id }) => id === entityId);
  }
}
