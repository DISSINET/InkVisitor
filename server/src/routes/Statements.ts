import {Request, Response, Router} from 'express';
import {BAD_REQUEST, CREATED, OK} from 'http-status-codes';
import { v4 as uuid4} from 'uuid';

import { paramMissingError } from '@shared/constants';
import { stat } from 'fs';

class Statement {
    
    public id : string; //uuid
    public tree: object;
    public territoryId: string; //uuid
    public resources : Array<string>; //uuids
    public actionId : string; //uuid
    public modality : number; //int
    public certainty : number; //int
    public epistemicLevel : number; //int
    public tags: Array<string> //uuids;
    public note: string;
    public meta: string /*or object?*/;
    public text: string;

    constructor(
        id: string, 
        tree: object,
        territoryId: string, 
        resources: Array<string>, 
        actionId: string, 
        modality: number, 
        certainty: number,
        epistemicLevel: number,
        tags: Array<string>, 
        note: string, 
        meta: string, 
        text: string
    ) {
        this.id = id;
        this.tree = tree;    
        this.territoryId = territoryId;
        this.resources = resources;
        this.actionId = actionId; 
        this.modality = modality;
        this.certainty = certainty;
        this.epistemicLevel = epistemicLevel
        this.tags = tags;
        this.note = note;
        this.meta = meta;
        this.text = text
    }

    /**
     * Create a mockup statement.
     */
    static createMockup(territoryId: string) : Statement {
        return new Statement(
            uuid4(),
            {},    
            territoryId,
            [uuid4(), uuid4(), uuid4()],
            uuid4(), 
            1,
            2,
            3,
            [uuid4(), uuid4(), uuid4()],
            "note",
            "meta",
            "text"
        )
    }
}

interface Repository<T> {
    findAll(limit: number, offset: number, filters : object) : Promise<T[]>;
    findOne(id: string) : Promise<T | undefined>;
    insertOne(entity: T) : Promise<void>;
    removeOne(id: string) : Promise<void>;
}

interface IStatementRepository extends Repository<Statement> {
}

/**
 * The statement entity repository.
 */
class StatementRepository implements IStatementRepository {

    private statements : Map<string, Statement>;

    constructor() {
        // Mockups
        this.statements = new Map([
            Statement.createMockup("1"),
            Statement.createMockup("1"),
            Statement.createMockup("2"),
            Statement.createMockup("2"),
            Statement.createMockup("3"),
        ].map(statement => [statement.id, statement]))
    
    }

    /**
     * 
     * @param  
     */
    async insertOne(statement: Statement) :Promise<void> { 
        // if statement in statements raise exception.
        this.statements.set(statement.id, statement);
    }

    /**
     * Remove one statetement.
     * @param statementId
     */
    async removeOne(statementId: string) : Promise<void> {
        this.statements.delete(statementId)
    }

    /**
     * Get the all statements.
     */
    async findAll(limit: number, offset: number, filters = {}) : Promise<Statement[]> {
        const result = [...this.statements.values()]
        
        console.log(result)

        if ("territoryId" in filters) {
            // Only territoryId implemented.
            return result.filter( _ => filters["territoryId"] === _.territoryId);
        }
        return result
    }
    
    /**
     * Get the one statement.
     * @param id 
     */
    async findOne(statementId: string /*UUID*/ ) : Promise<Statement | undefined> {
        return [...this.statements.values()].find( ({id}) => id === statementId )
    }
}

const router = Router()
const repository = new StatementRepository() 

/**  
 * Get the statements `GET /api/statements`.
 */
router.get("/", async (request: Request, response: Response) => {
    const filters = request.query //.filter( (x) => !(x in ["offset", "limit"]) )
    //console.log(filters)
    const statements = await repository.findAll(100, 0, filters);
    return response.status(OK).json(statements);
})

/** 
 *  Get the statement `GET /api/statements/:id`. 
 */
router.get("/:uuid", async (request: Request, response: Response) => {
    const uuid = request.params.uuid;
    const statement = await repository.findOne(uuid);
    return response.status(OK).json(statement);
})

/**
 * Create the statement `POST /api/statement`.
 */
router.post('/', async (request: Request, response: Response) => {

    const { statement } = request.body;
    
    if (!statement) {
        return response.status(BAD_REQUEST).json({
            error: paramMissingError,
        });
    }

    await repository.insertOne(statement);

    return response.status(CREATED).end();
});

export default router;