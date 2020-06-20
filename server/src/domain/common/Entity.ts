
/**
 * A type with generic identity. 
 */
export interface Identifiable<Identity> {
    id: Identity;
}

/**
 * An entity with generic identity. 
 */
export interface IEntity<Identity> extends Identifiable<Identity> { }

/**
 * An entity with generic identity.
 */
export class Entity<Identity> implements IEntity<Identity> {
    constructor(public readonly id: Identity) { }
}
