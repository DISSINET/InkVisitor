
/**
 * A repository to create, read, update and delete entity. 
 * @param Entity The entity type
 */
export interface IRepository<Entity> {
    /**
     * Find the entities.
     * @param limit
     * @param offset 
     * @param filters 
     */
    findAll(limit: number, offset: number, filters: object): Promise<Entity[]>;

    /**
     * Find the entity.
     * @param identity 
     */
    findOne(identity: string): Promise<Entity | undefined>;

    /**
     * Insert the entity.
     * @param entity
     */
    insertOne(entity: Entity): Promise<void>;

    /**
     * Remove the entity.
     * @param identity The identity. 
     */
    removeOne(identity: string): Promise<void>;

    // updateOne(identity: string): Promise<void>;
}
