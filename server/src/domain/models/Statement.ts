import { IEntity } from "../common"
import { IRepository } from "../common"
import { create } from 'domain';

export type StatementProps = {
    id: string; //uuid
    tree: object;
    territoryId: string; //uuid
    resources: Array<string>; //uuids
    actionId: string; //uuid
    modality: number; //int
    certainty: number; //int
    epistemicLevel: number; //int
    tags: Array<string> //uuids;
    note: string;
    meta: string /*or object?*/;
    text: string;
}

/**
 * Use this interface outside of the domain layer.
 */
interface IStatement extends IEntity<string>, StatementProps { }

/**
 * The statement entity.
 * 
 * Don't use outside of the domain
 */
export class Statement implements IStatement {
    private constructor(
        public id: string, //uuid
        public tree: object,
        public territoryId: string, //uuid
        public resources: Array<string>, //uuids
        public actionId: string, //uuid
        public modality: number, //int
        public certainty: number, //int
        public epistemicLevel: number, //int
        public tags: Array<string>, //uuid
        public note: string,
        public meta: string, /*or object?*/
        public text: string,
    ) { }

    static create(props: StatementProps) {
        //return new Statement(props.)
    }
}



export interface IStatementRepository extends IRepository<IStatement> { }