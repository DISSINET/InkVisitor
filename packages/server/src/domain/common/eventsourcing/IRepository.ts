import { Version } from './Version';

interface AggregateRoot { }

type Void = void;

type Entity = object;

export type LoadEntity<Type extends Entity> = (type: Type, version: Version) => Promise<Type>;

export type SaveEntity<Type extends Entity> = (type: Type, version: Version) => Promise<Void>;
