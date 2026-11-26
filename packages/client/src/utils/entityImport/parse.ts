import { isPlainObject } from "./helpers";
import { ImportIssue } from "./types";

/**
 * The text with a space for each comma that closes a list or an object, as in
 * `[1, 2,]`; every other character keeps its offset.
 */
const blankTrailingCommas = (text: string): string => {
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
        result += " ";
        continue;
      }
    }
    result += char;
  }
  return result;
};

/**
 * Where JSON.parse stopped, from its message: Chrome names the position or
 * quotes the text around it, Firefox names the line and column; Safari names
 * neither.
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
  // Chrome names no place for an unexpected token, but quotes the text around
  // it: up to 10 characters on either side, with "..." where it cut the text
  const excerpt = message.match(/, (\.\.\.)?"([\s\S]*)"(\.\.\.)? is not valid JSON/);
  if (excerpt) {
    const [, cutBefore, quoted, cutAfter] = excerpt;
    if (cutBefore && cutAfter) {
      const start = text.indexOf(quoted);
      return start === -1 ? undefined : start + 10;
    }
    if (cutAfter) {
      return Math.max(quoted.length - 10, 0);
    }
    if (cutBefore) {
      return text.length - quoted.length + 10;
    }
    // the whole text is quoted, short enough to need no jump
    return undefined;
  }
  if (message.includes("end of JSON input")) {
    return text.length;
  }
  return undefined;
};

/**
 * Reads the pasted text into a list of entity objects: a single object, an
 * array of 1 to `maxEntities` objects, or an Explorer JSON export, whose
 * `entities` are read. Trailing commas, which language models often leave,
 * are accepted.
 */
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
  } catch {
    // the error of the text without its trailing commas, which the import
    // accepts; their blanks keep its position pointing into the input, and
    // the text Chrome quotes is found in the blanked text
    const blanked = blankTrailingCommas(text);
    try {
      parsed = JSON.parse(blanked);
    } catch (error) {
      return {
        items: [],
        errors: [
          {
            message: `Invalid JSON: ${(error as Error).message}`,
            offset: jsonErrorOffset((error as Error).message, blanked),
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
