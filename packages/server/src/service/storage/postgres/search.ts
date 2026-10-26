import { EntityEnums } from "@inkvisitor/shared/enums";
import { prepareLabel } from "../../../common/searchLabel";
import { TABLE } from "../names";
import { SearchFilters } from "../types";
import { Params, arr, ident } from "./sql";

/**
 * The label regex of searchWordByWord in ../rethink/search.ts, as a string:
 * word boundaries on a side without a wildcard, a class per vowel (and c, n,
 * y) so accented and plain spellings find each other, glue between words.
 * RE2's `\w` is ASCII while PostgreSQL's follows the locale, so the glue
 * spells the class out. `(?i)` is an embedded option in both engines, which
 * is why the pattern is matched with `~`.
 */
export function labelPattern(label: string, left: string, right: string): string {
  if (left === "^") {
    left = "(^|[^a-zA-Z0-9])";
  }
  if (right === "$") {
    right = "($|[^a-zA-Z0-9])";
  }
  const map: Record<string, string> = {
    a: "[aàáâãäå]",
    e: "[eèéêë]",
    i: "[iìíîï]",
    o: "[oòóôõö]",
    u: "[uùúûü]",
    y: "[yýÿ]",
    n: "[nñ]",
    c: "[cç]",
  };
  const body = label
    .toLowerCase()
    .split("")
    .map((char) => map[char] || char)
    .join("")
    .split(" ")
    .join("([^a-zA-Z0-9]+[0-9A-Za-z_]+)*[^a-zA-Z0-9]+");
  return `(?i)${left}${body}${right}`;
}

/** true when one of the row's labels matches `pattern` */
export const labelMatch = (p: Params, pattern: string): string =>
  `EXISTS (SELECT 1 FROM unnest(labels) l WHERE l ~ ${p.add(pattern)})`;

const REGEX_CHARS = /[.*+?^${}()|[\]\\]/g;

/**
 * WHERE clauses of the entity search, in the order fromFilters in
 * ../rethink/search.ts applies them. `seedIds` restricts the scan before any
 * filter, like the ReQL getAll seed.
 */
export function searchWhere(filters: SearchFilters, seedIds: string[] | undefined, p: Params): string {
  const where: string[] = [];
  if (seedIds) {
    where.push(`id = ANY(${p.add(seedIds)}::text[])`);
  }
  if (filters.class) {
    where.push(`class = ${p.add(filters.class)}`);
  }
  if (filters.status) {
    where.push(`status = ${p.add(filters.status)}`);
  }
  if (filters.usedTemplate) {
    where.push(`used_template = ${p.add(filters.usedTemplate)}`);
  }
  if (filters.language !== undefined) {
    where.push(`language = ${p.add(filters.language)}`);
  }
  if (filters.onlyTemplates) {
    where.push(`is_template = 'true'`);
  }
  if (filters.resourceHasDocument) {
    // an unqualified `doc` inside a subquery over documents would bind to d.doc,
    // so the document id is compared through IN on the outer row
    where.push(
      `class = '${EntityEnums.Class.Resource}' AND coalesce(document_id, '') <> '' ` +
        `AND document_id IN (SELECT d.id FROM ${ident(TABLE.documents)} d)`
    );
  }
  if (filters.excluded) {
    where.push(`NOT (class = ANY(${p.add(filters.excluded)}::text[]))`);
  }
  if (filters.label) {
    const [label, left, right] = prepareLabel(filters.label);
    where.push(labelMatch(p, labelPattern(label, left, right)));
  }
  if (filters.labelOrId) {
    const [label, left, right] = prepareLabel(filters.labelOrId);
    // the id is a prefix of the literal input, without the wildcard the client appends
    const idPrefix = filters.labelOrId.replace(/\*$/, "");
    where.push(
      `(${labelMatch(p, labelPattern(label.replace(REGEX_CHARS, "\\$&"), left, right))} OR starts_with(id, ${p.add(idPrefix)}))`
    );
  }
  if (filters.entityIds) {
    where.push(`id = ANY(${p.add(filters.entityIds)}::text[])`);
  }
  if (filters.haveReferenceTo) {
    // the column holds resource and value ids both, so the document decides the side
    const ref = p.add(filters.haveReferenceTo);
    where.push(
      `(reference_entity_ids && ARRAY[${ref}]::text[] AND EXISTS (SELECT 1 FROM jsonb_array_elements(${arr("doc->'references'")}) ref WHERE ref->>'resource' = ${ref}))`
    );
  }
  return where.length ? where.join(" AND ") : "TRUE";
}
