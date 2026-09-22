import { Connection, r, RDatum, RTable } from "rethinkdb-ts";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { SearchFilters } from "../types";
import { prepareLabel } from "../../../common/searchLabel";

const TABLE_ENTITIES = "entities";
const TABLE_DOCUMENTS = "documents";

/**
 * Word-boundary label match with optional wildcards on either side.
 * @param row - RDatum from rethink api
 * @param label - cleaned label input (with escaped chars)
 * @param left - optional wildcard on the left
 * @param right - optional wildcard on the right
 * @param normalize - unused today; both variants build the same pattern
 * @returns filtration statement for RDatum
 */
export function searchWordByWord(
  row: RDatum,
  label: string,
  left: string,
  right: string,
  normalize = true
): RDatum<boolean> {
  // if wildcard not used, update the left/right side to simulate word boundaries
  if (left === "^") {
    left = "(^|[^a-zA-Z0-9])";
  }
  if (right === "$") {
    right = "($|[^a-zA-Z0-9])";
  }

  // Instead of normalizing, create a pattern that matches both accented and non-accented versions
  const processedLabel = label.toLowerCase();
  const diacriticPattern = processedLabel
    .split("")
    .map((char) => {
      // Map common accented characters to their base form with optional accents
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
      return map[char] || char;
    })
    .join("");

  const regexBody = diacriticPattern
    .split(" ")
    .join("([^a-zA-Z0-9]+[\\w]+)*[^a-zA-Z0-9]+"); // Allow glue between words

  const regexp = `(?i)${left}${regexBody}${right}`;

  return row("labels").contains<string>((targetLabel) => targetLabel.match(regexp));
}

/**
 * Builds the entity search query by chaining prepared filters, in the order
 * the request fields are applied. The `entityIds` filter comes last: once any
 * other filter is on the chain it has to be a `filter`, a bare id list can use
 * the primary index directly.
 */
export class SearchQuery {
  query: RTable<any>;
  filterUsed?: boolean;

  constructor() {
    this.query = r.table(TABLE_ENTITIES);
  }

  /** restricts the scan to these rows before any filter */
  seed(ids: string[]): void {
    this.query = this.query.getAll(r.args(ids)) as any;
    this.filterUsed = true;
  }

  whereClass(entityClass: EntityEnums.Class | EntityEnums.Extension.Any): SearchQuery {
    this.query = this.query.filter({ class: entityClass });
    this.filterUsed = true;
    return this;
  }

  whereStatus(status: EntityEnums.Status): SearchQuery {
    this.query = this.query.filter({ status: status });
    this.filterUsed = true;
    return this;
  }

  whereNotClass(entityClass: EntityEnums.Class[]): SearchQuery {
    this.query = this.query.filter(function (row: RDatum) {
      return r.expr(entityClass).contains(row("class")).not();
    });
    this.filterUsed = true;
    return this;
  }

  whereUsedTemplate(tpl: string): SearchQuery {
    this.query = this.query.filter({ usedTemplate: tpl });
    this.filterUsed = true;
    return this;
  }

  whereIsTemplate(): SearchQuery {
    this.query = this.query.filter({ isTemplate: true });
    this.filterUsed = true;
    return this;
  }

  whereResourcesHasDocument(): SearchQuery {
    this.query = this.query.filter(function (row: RDatum) {
      return r.and(
        row("class").eq(EntityEnums.Class.Resource),
        row.hasFields({ data: { documentId: true } }),
        row("data")("documentId").ne(""),
        r.table(TABLE_DOCUMENTS).get(row("data")("documentId")).ne(null)
      );
    });
    return this;
  }

  whereHaveReferenceTo(refId: string): SearchQuery {
    this.query = this.query.filter(function (row: RDatum) {
      return row("references").contains(function (ref: RDatum) {
        return ref("resource").eq(refId);
      });
    });
    return this;
  }

  whereLanguage(language: EntityEnums.Language): SearchQuery {
    this.query = this.query.filter({ language: language });
    this.filterUsed = true;
    return this;
  }

  whereLabel(label: string): SearchQuery {
    const [preparedLabel, leftWildcard, rightWildcard] = prepareLabel(label);

    this.query = this.query.filter(function (row: RDatum) {
      return searchWordByWord(row, preparedLabel, leftWildcard, rightWildcard);
    });

    this.filterUsed = true;
    return this;
  }

  whereLabelOrId(labelOrId: string): SearchQuery {
    const [label, leftWildcard, rightWildcard] = prepareLabel(labelOrId);

    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // id is matched as a prefix of the literal input: strip the trailing
    // wildcard the client appends, then escape regex chars and anchor at start
    const idPrefix = labelOrId.replace(/\*$/, "");
    const escapedIdPrefix = idPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // search 3 times:
    // 1. search for exact word match with some normalization
    // 2. search for exact word match without normalization
    // 3. search for id prefix match
    this.query = this.query.filter(function (row: RDatum) {
      return r.or(
        searchWordByWord(row, escapedLabel, leftWildcard, rightWildcard),
        searchWordByWord(row, escapedLabel, leftWildcard, rightWildcard, false),
        row("id").match("^" + escapedIdPrefix).ne(null)
      );
    });

    this.filterUsed = true;
    return this;
  }

  whereEntityIds(entityIds: string[]): SearchQuery {
    if (this.filterUsed) {
      this.query = this.query.filter((row: RDatum) => r.expr(entityIds).contains(row("id")));
    } else {
      this.query = this.query.getAll(r.args(entityIds)) as any;
    }
    return this;
  }

  fromFilters(req: SearchFilters): void {
    if (req.class) {
      this.whereClass(req.class);
    }

    if (req.status) {
      this.whereStatus(req.status);
    }

    if (req.usedTemplate) {
      this.whereUsedTemplate(req.usedTemplate);
    }

    if (req.language !== undefined) {
      this.whereLanguage(req.language);
    }

    if (req.onlyTemplates) {
      this.whereIsTemplate();
    }

    if (req.resourceHasDocument) {
      this.whereResourcesHasDocument();
    }

    if (req.excluded) {
      this.whereNotClass(req.excluded);
    }

    if (req.label) {
      this.whereLabel(req.label);
    }

    if (req.labelOrId) {
      this.whereLabelOrId(req.labelOrId);
    }

    if (req.entityIds) {
      this.whereEntityIds(req.entityIds);
    }

    if (req.haveReferenceTo) {
      this.whereHaveReferenceTo(req.haveReferenceTo);
    }
  }

  run(conn: Connection): Promise<IEntity[]> {
    return this.query.run(conn);
  }
}
