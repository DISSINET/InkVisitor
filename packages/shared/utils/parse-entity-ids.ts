const ENTITY_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Parses space-, tab-, line-break-, or comma-separated entity UUIDs from pasted text.
 * Invalid tokens are ignored; duplicates are removed (first occurrence order preserved).
 */
export const parseEntityIdsFromText = (text: string): string[] => {
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const token of text.split(/[\s,\t\n\r]+/)) {
    const trimmed = token.trim();
    if (!trimmed || !ENTITY_ID_RE.test(trimmed)) {
      continue;
    }
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    ids.push(trimmed);
  }

  return ids;
};

export const entityIdsEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  const setB = new Set(b.map((id) => id.toLowerCase()));
  return a.every((id) => setB.has(id.toLowerCase()));
};
