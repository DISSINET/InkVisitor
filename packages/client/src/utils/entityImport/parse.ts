import { isPlainObject } from "./helpers";
import { ImportIssue, MAX_IMPORT_ENTITIES } from "./types";

/**
 * Reads the pasted text into a list of entity objects: a single object or an
 * array of 1 to MAX_IMPORT_ENTITIES objects.
 */
export const parseImportInput = (text: string): { items: unknown[]; errors: ImportIssue[] } => {
  if (!text.trim()) {
    return { items: [], errors: [{ message: "Paste JSON or load a .json file" }] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      items: [],
      errors: [{ message: `Invalid JSON: ${(error as Error).message}` }],
    };
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];

  if (items.length === 0) {
    return { items: [], errors: [{ message: "The input holds no entity" }] };
  }
  if (items.length > MAX_IMPORT_ENTITIES) {
    return {
      items: [],
      errors: [
        {
          message: `The input holds ${items.length} entities; at most ${MAX_IMPORT_ENTITIES} can be imported at once`,
        },
      ],
    };
  }

  const errors: ImportIssue[] = [];
  items.forEach((item, itemIndex) => {
    if (!isPlainObject(item)) {
      errors.push({ entityIndex: itemIndex + 1, message: "must be a JSON object" });
    }
  });

  return { items, errors };
};
