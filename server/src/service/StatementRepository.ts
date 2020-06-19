import { IStatement, Statement } from "../domain/Statement";
import { IRepository } from "../domain/Repository";
import * as statementMocks from "../../../import/import_data/mock/statements.json";

export interface IStatementRepository extends IRepository<IStatement> { }

/**
 * The statement entity repository.
 */
export class StatementRepository implements IStatementRepository {

    private statements: Map<string, IStatement>;

    constructor() {
        this.statements = new Map(
            Object.values(statementMocks).map(_ => [_.id, new Statement(_)])
        )
    }

    /**
     * 
     * @param  
     */
    async insertOne(entity: IStatement): Promise<void> {
        // if statement in statements raise exception.
        this.statements.set(entity.id, entity);
    }

    /**
     * Remove the entity.
     */
    async removeOne(entityId: string): Promise<void> {
        if (!(entityId in this.statements)) {
            throw new Error(`Entity ${entityId} not found.`)
        }
        this.statements.delete(entityId);
    }

    /**
     * Get the entitites.
     */
    async findAll(limit: number, offset: number, filters = {}): Promise<IStatement[]> {
        const result = [...this.statements.values()]

        if ("territoryId" in filters) {
            // Only territoryId implemented.
            return result.filter(_ => filters["territoryId"] === _.territoryId);
        }
        return result
    }

    /**
     * Get the entity.
     * @param entityId 
     */
    async findOne(entityId: string /*UUID*/): Promise<Statement | undefined> {
        return [...this.statements.values()].find(({ id }) => id === entityId)
    }
}