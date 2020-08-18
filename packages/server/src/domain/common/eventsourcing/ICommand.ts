import { IMessage } from './IMessage';

export interface Command<T> extends IMessage<T> { }