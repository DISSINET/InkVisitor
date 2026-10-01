import { WriteResult } from "rethinkdb-ts";

/** How many documents one bulk write query carries. */
export const WRITE_CHUNK = 1000;

/** `items` in consecutive chunks of at most `size`. */
export function chunksOf<T>(items: T[], size: number = WRITE_CHUNK): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Ids of the documents a write run with `returnChanges: "always"` wrote: a
 * change entry with a new value and no error. A failed document's entry
 * carries an error, and a missing document yields no entry with a new value,
 * so neither counts.
 */
export function writtenIds(result: WriteResult): string[] {
  return (result.changes ?? [])
    .filter((change) => !(change as { error?: string }).error && change.new_val)
    .map((change) => (change.new_val as { id: string }).id);
}
