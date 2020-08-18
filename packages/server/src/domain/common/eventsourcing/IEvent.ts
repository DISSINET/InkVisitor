import { IMessage } from './IMessage'

export interface IEvent<T> extends IMessage<T> { }

export class Event<T> implements IEvent<T> {
    public constructor(
        readonly id: string,
        readonly type: T,
        readonly version: number,
        readonly payload: object
    ) { }
}