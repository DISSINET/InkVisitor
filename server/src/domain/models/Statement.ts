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
        readonly id: string,
        readonly tree: object,
        readonly territoryId: string,
        readonly resources: Array<string>,
        readonly actionId: string,
        readonly modality: number,
        readonly certainty: number,
        readonly epistemicLevel: number,
        readonly tags: Array<string>,
        readonly note: string,
        readonly meta: string,
        readonly text: string,
    ) { }

    static create(props: StatementProps) {
        //return new Statement(props.)
    }
}



export interface IStatementRepository extends IRepository<IStatement> { }