import { Db } from "@service/RethinkDB";
import { Connection, WriteResult } from "rethinkdb-ts";

type GenericObject = { [key: string]: any };
export type UnknownObject = GenericObject | undefined;

export interface IModel {
  isValid(): boolean; // validate model before inserting to the db
}

export interface IDbModel extends IModel {
  id?: string;
  data?: any;
  save(dbInstance: Connection | undefined): Promise<WriteResult>;
  update(
    dbInstance: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult>;
  delete(dbInstance: Connection | undefined): Promise<WriteResult>;
}

export function fillFlatObject<T>(
  ctx: T,
  source: Record<string, unknown> | null
): void {
  if (!source) {
    return;
  }
  for (const key of Object.keys(source)) {
    const wantedType = typeof (ctx as Record<string, unknown>)[key];
    if (wantedType === "undefined") {
      continue;
    }

    if (
      ((ctx as Record<string, unknown>)[key] as any).constructor.name === "Date"
    ) {
      (ctx as Record<string, unknown>)[key] = source[key];
      continue;
    }

    if (wantedType === "object") {
      // only flat object's props
      continue;
    }

    const gotType = typeof source[key];

    if (
      gotType === "object" &&
      wantedType === "boolean" &&
      (ctx as Record<string, unknown>)[key] === false
    ) {
      continue;
    }

    if (wantedType !== gotType) {
      continue;
    }

    (ctx as Record<string, unknown>)[key] = source[key];
  }
}

type AConstructorTypeOf<T> = new (...data: any[]) => T;

export function fillArray<T>(
  ctx: T[],
  constructor: AConstructorTypeOf<T>,
  source: unknown[] | unknown
): void {
  if (!source) {
    return;
  }
  for (const sourceElement of source as unknown[]) {
    switch (constructor.name) {
      case "String":
        ctx.push(sourceElement as T);
        break;
      default:
        ctx.push(new constructor(sourceElement));
    }
  }
}
