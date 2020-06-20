import { IEntity } from "./common"
import { IRepository } from "./common"

export interface IStatement extends IEntity {
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

export class Statement implements IStatement {

    public id: string; //uuid
    public tree: object;
    public territoryId: string; //uuid
    public resources: Array<string>; //uuids
    public actionId: string; //uuid
    public modality: number; //int
    public certainty: number; //int
    public epistemicLevel: number; //int
    public tags: Array<string> //uuids;
    public note: string;
    public meta: string /*or object?*/;
    public text: string;

    constructor({
        id,
        tree,
        territoryId,
        resources,
        actionId,
        modality,
        certainty,
        epistemicLevel,
        tags,
        note,
        meta,
        text
    }: IStatement) {
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
}

export interface IStatementRepository extends IRepository<IStatement> { }