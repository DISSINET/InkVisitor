
export interface IRepository<T> {
    findAll(limit: number, offset: number, filters: object): Promise<T[]>;
    findOne(id: string): Promise<T | undefined>;
    insertOne(entity: T): Promise<void>;
    removeOne(id: string): Promise<void>;
}
