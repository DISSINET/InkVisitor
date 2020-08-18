import { Version } from './Version';

/**
 * A system message.
 */
export type IMessage<Entity> = {
    id: string;
    type: Entity;
    version: Version;
    payload: object;
}