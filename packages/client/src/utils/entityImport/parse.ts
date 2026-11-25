import { isPlainObject } from "./helpers";
import { ImportIssue } from "./types";

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
 * array of 1 to `maxEntities` objects. Trailing commas, which language
 * models often leave, are accepted.
 */
/**
 * Where JSON.parse stopped, from its message: Chrome names the position,
 * Firefox the line and column; Safari names neither.
 */
export const jsonErrorOffset = (message: string, text: string): number | undefined => {
  const position = message.match(/position (\d+)/);
  if (position) {
    return Math.min(Number(position[1]), text.length);
  }
  const lineColumn = message.match(/line (\d+) column (\d+)/);
  if (lineColumn) {
    const lines = text.split("\n").slice(0, Number(lineColumn[1]) - 1);
    const lineStart = lines.reduce((sum, line) => sum + line.length + 1, 0);
    return Math.min(lineStart + Number(lineColumn[2]) - 1, text.length);
  }
  return undefined;
};

export const parseImportInput = (
  text: string,
  maxEntities: number,
  // ids of items that don't count toward maxEntities
  uncountedIds: ReadonlySet<string> = new Set()
): { items: unknown[]; errors: ImportIssue[] } => {
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
        errors: [
          {
            message: `Invalid JSON: ${(error as Error).message}`,
            offset: jsonErrorOffset((error as Error).message, text),
          },
        ],
      };
    }
  }

  // an Explorer JSON export holds the entities under `entities`, beside the
  // query and the audits; an entity itself always has a class
  const isExport =
    isPlainObject(parsed) && Array.isArray(parsed.entities) && !("class" in parsed);
  const items = isExport
    ? (parsed as { entities: unknown[] }).entities
    : Array.isArray(parsed)
      ? parsed
      : [parsed];

  if (items.length === 0) {
    return { items: [], errors: [{ message: "The input holds no entity" }] };
  }
  const counted = items.filter(
    (item) => !uncountedIds.has(String((item as { id?: unknown } | null)?.id))
  ).length;
  if (counted > maxEntities) {
    return {
      items: [],
      errors: [
        {
          message: `The input holds ${counted} entities; at most ${maxEntities} can be imported at once`,
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
