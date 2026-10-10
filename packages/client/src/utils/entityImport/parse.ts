import { isPlainObject } from "./helpers";
import { ImportIssue, MAX_IMPORT_ENTITIES } from "./types";

/** The text without commas that close a list or an object, as in `[1, 2,]`. */
const removeTrailingCommas = (text: string): string => {
  let result = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (char === "\\") {
        result += char + (text[i + 1] ?? "");
        i++;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
    } else if (char === ",") {
      const next = text.slice(i + 1).match(/^\s*(\S)/)?.[1];
      if (next === "}" || next === "]") {
        continue;
      }
    }
    result += char;
  }
  return result;
};

/**
 * Reads the pasted text into a list of entity objects: a single object or an
 * array of 1 to MAX_IMPORT_ENTITIES objects. Trailing commas, which language
 * models often leave, are accepted.
 */
export const parseImportInput = (text: string): { items: unknown[]; errors: ImportIssue[] } => {
  if (!text.trim()) {
    return { items: [], errors: [{ message: "Paste JSON or load a .json file" }] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    // the error reported is the one of the text as pasted, so its position
    // points into the input
    try {
      parsed = JSON.parse(removeTrailingCommas(text));
    } catch {
      return {
        items: [],
        errors: [{ message: `Invalid JSON: ${(error as Error).message}` }],
      };
    }
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
