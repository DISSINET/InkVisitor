import { Connection, WriteResult } from "rethinkdb-ts";

type GenericObject = { [key: string]: any };
export type UnknownObject = GenericObject | undefined;

export interface IModel {
  isValid(): boolean; // validate model before inserting to the db
}

export interface IDbModel extends IModel {
  id: string;
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
  const target = (ctx as Record<string, unknown>);

  for (const key of Object.keys(source)) {
    const descriptor = Object.getOwnPropertyDescriptor(ctx, key);
    if (!descriptor || !descriptor.writable) {
      continue
    }

    const wantedType = typeof target[key];
    const gotType = typeof source[key];

    if (wantedType === "object" || (wantedType !== gotType && wantedType !== "undefined")) {
      // only flat object's props && types must match
      continue;
    }

    target[key] = source[key];
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
