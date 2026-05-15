// Lightweight helpers for windowed caching and signature-based IDs.
// These utilities are used by both React Query write-through and the Explorer read path.
// They are intentionally framework-agnostic and can be used with TanStack DB collections.

import { IEntity, IResponseQueryEntity } from "@shared/types";

export interface WindowSlice {
  id: string;
  signature: string;
  offset: number;
  limit: number;
  total: number;
  ids: string[];
}

export const buildWindowId = (signature: string, offset: number, limit: number): string => {
  return `${signature}:${offset}:${limit}`;
};

export const clampWindow = (
  total: number,
  offset: number,
  limit: number
): { offset: number; limit: number } => {
  const safeOffset = Math.max(0, Math.min(offset, Math.max(0, total - 1)));
  const safeLimit = Math.max(1, Math.min(limit, Math.max(1, total - safeOffset)));
  return { offset: safeOffset, limit: safeLimit };
};

// Builds a deterministic signature for the current query + explore configuration
// that affects identity and ordering of results. Explicitly excludes the window
// controls (offset, limit) so different windows share the same stable signature.
//
// Note: This is deliberately conservative and simple. If sort/filters/columns semantics
// evolve, revisit this to ensure the signature captures the ordering identity.

type Jsonish = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined;

export const buildStableSignature = (queryState: Jsonish, exploreState: Jsonish): string => {
  const normalizedExplore = normalizeExplore(exploreState);
  // Deterministic stringify by sorting object keys
  const stableString = stableStringify({
    query: queryState,
    explore: normalizedExplore,
  });
  return hashString(stableString);
};

const normalizeExplore = (exploreState: Jsonish): Jsonish => {
  if (!exploreState || typeof exploreState !== "object" || Array.isArray(exploreState)) {
    return exploreState;
  }
  const e = exploreState as Record<string, unknown>;
  const { offset: _omitOffset, limit: _omitLimit, ...rest } = e;
  return rest;
};

const stableStringify = (value: Jsonish): string => {
  return JSON.stringify(value, replacer, 0);
};

const replacer = (_key: string, value: unknown): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      sorted[k] = obj[k];
    });
  return sorted;
};

const hashString = (s: string): string => {
  // Simple, fast, stable 32-bit hash converted to base36 for compactness.
  // Not cryptographic; just to keep query keys short.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Convert to unsigned and base36
  return (h >>> 0).toString(36);
};

function isEntityCellValue(value: unknown): value is IEntity {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    "class" in value &&
    typeof (value as IEntity).id === "string"
  );
}

/** Resolve an entity id from the main row entity or any column that holds IEntity / IEntity[]. */
function findEntityInQueryRow(row: IResponseQueryEntity, entityId: string): IEntity | undefined {
  if (row.entity?.id === entityId) {
    return row.entity;
  }
  for (const cell of Object.values(row.columnData ?? {})) {
    if (isEntityCellValue(cell)) {
      if (cell.id === entityId) {
        return cell;
      }
      continue;
    }
    if (Array.isArray(cell)) {
      for (const item of cell) {
        if (isEntityCellValue(item) && item.id === entityId) {
          return item;
        }
      }
    }
  }
  return undefined;
}

export function findEntityInQueryItems(
  rows: (IResponseQueryEntity | null | undefined)[],
  entityId: string
): IEntity | undefined {
  for (const row of rows) {
    if (!row) {
      continue;
    }
    const found = findEntityInQueryRow(row, entityId);
    if (found) {
      return found;
    }
  }
  return undefined;
}
