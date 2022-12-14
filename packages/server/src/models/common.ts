import { EntityEnums } from "@shared/enums";
import { Connection, WriteResult } from "rethinkdb-ts";

type GenericObject = { [key: string]: any; };
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

export const determineOrder = (want: number, sibl: Record<number, unknown>): number => {
  const sortedOrders: number[] = Object.keys(sibl)
    .map((k) => parseFloat(k))
    .sort((a, b) => a - b);

  if (!sortedOrders.length) {
    // no sibling - use default position 0
    return 0;
  }

  if (want === undefined) {
    // if want is not provided, use Last position by default
    want = EntityEnums.Order.Last;
  }

  if (want === EntityEnums.Order.Last) {
    return sortedOrders[sortedOrders.length - 1] + 1;
  } else if (want === EntityEnums.Order.First) {
    return sortedOrders[0] - 1;
  }

  let out = -1;

  if (sibl[want]) {
    // if there is a conflict - wanted order value already exists
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] === want) {
        if (sortedOrders.length === i + 1) {
          // conflict occured on the biggest number - use closest bigger free integer
          const ceiled = Math.ceil(sortedOrders[i]);
          out = ceiled === sortedOrders[i] ? ceiled + 1 : ceiled;
          break;
        }

        // new number would be somewhere behind the wanted position(i) and before
        // the next position(i+1)
        out = sortedOrders[i] + (sortedOrders[i + 1] - sortedOrders[i]) / 2;
        if (!sibl[Math.round(out)]) {
          out = Math.round(out);
        }

        break;
      }
    }
  } else {
    // all good
    out = want;
    // less than zero -> zero optional fix
    if (out < 0 && (sortedOrders.length === 0 || sortedOrders[0] > 0)) {
      out = 0;
    }
  }

  return out;
};
