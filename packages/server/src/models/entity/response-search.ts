import { EntityEnums } from "@shared/enums";
import { IEntity, RequestSearch } from "@shared/types";
import { regExpEscape } from "@common/functions";
import Entity from "./entity";
import Statement from "@models/statement/statement";
import { Connection, r, RDatum, RTable } from "rethinkdb-ts";
import { ResponseEntity } from "./response";
import { getEntityClass } from "@models/factory";
import { IRequest } from "src/custom_typings/request";

/**
 * SearchQuery is customized builder for search queries, allowing to build query by chaining prepared filters
 */
export class SearchQuery {
  usedLabel?: string; // used for additional sorting
  retainedIdsOrder?: string[]; // used for additional sorting - to respect provided entityIds

  connection: Connection;
  query: RTable<any>;

  constructor(conn: Connection) {
    this.connection = conn;
    this.query = r.table(Entity.table);
  }

  /**
   * searches Statements to find all associated entities
   * ids can be then used in whereEntityIds method
   * @param cooccurrenceId
   * @returns
   */
  async getCooccurredEntitiesIds(cooccurrenceId: string): Promise<string[]> {
    const associatedEntityIds = await Statement.getActantsIdsFromLinkedEntities(
      this.connection,
      cooccurrenceId
    );

    // filter out duplicates
    return [...new Set(associatedEntityIds)];
  }

  /**
   * adds condition to limit results by filtering by specific class
   * @param entityClass
   * @returns
   */
  whereClass(entityClass: EntityEnums.Class): SearchQuery {
    this.query = this.query.filter({
      class: entityClass,
    });

    return this;
  }

  /**
   * adds condition to limit results by excluding specific classes
   * @param entityClass
   * @returns
   */
  whereNotClass(entityClass: EntityEnums.Class[]): SearchQuery {
    this.query = this.query.filter(function (row: RDatum) {
      return r.and.apply(
        r,
        entityClass.map((c) => row("class").ne(c)) as [
          RDatum<boolean>,
          ...RDatum<boolean>[]
        ]
      );
    });

    return this;
  }

  /**
   * adds condition to limit results to entries with chosen usedTemplate
   * @param tpl
   * @returns
   */
  whereUsedTemplate(tpl: string): SearchQuery {
    this.query = this.query.filter({
      usedTemplate: tpl,
    });

    return this;
  }

  /**
   * adds condition to limit results to entries with isTemplate = true flag
   * @returns
   */
  whereIsTemplate(): SearchQuery {
    this.query = this.query.filter({
      isTemplate: true,
    });

    return this;
  }

  /**
   * adds condition to filter by label
   * @param label
   * @returns
   */
  whereLabel(label: string): SearchQuery {
    let leftWildcard: string = "^",
      rightWildcard: string = "$";

    if (label[0] === "*") {
      leftWildcard = "";
      label = label.slice(1);
    }

    if (label[label.length - 1] === "*") {
      rightWildcard = "";
      label = label.slice(0, -1);
    }

    this.usedLabel = label;

    // escape problematic chars - messes with regexp search
    label = regExpEscape(label.toLowerCase());

    this.query = this.query.filter(function (row: RDatum) {
      return SearchQuery.searchWordByWord(
        row,
        label,
        leftWildcard,
        rightWildcard
      );
    });

    return this;
  }

  /**
   * Provides basic search functionality which searches for the subscring with optional wildcard support
   * @param row - RDatum from rethink api
   * @param label - cleaned label input (with escaped chars)
   * @param left - optional wildcard on the left
   * @param right - optional wildcard on the right
   * @returns filtration statement for RDatum
   */
  public static searchByString(
    row: RDatum,
    label: string,
    left: string,
    right: string
  ): RDatum {
    return row("label").downcase().match(`${left}${label}${right}`);
  }

  /**
   * provides searching which respects word boundaries and provides optional wildcard support
   * @param row - RDatum from rethink api
   * @param label - cleaned label input (with escaped chars)
   * @param left - optional wildcard on the left
   * @param right - optional wildcard on the right
   * @returns filtration statement for RDatum
   */
  public static searchWordByWord(
    row: RDatum,
    label: string,
    left: string,
    right: string
  ): RDatum {
    // if wildcard not used, update the left/right side to limit search for word start/end
    // ie. search for 'building' would be changed to '(\^|[\\W \\.\\,\\:\\_])building'
    // to match 'building' word only
    // otherwise with wildcard, the '*uilding' would be changed to 'uilding' without constraint
    // and will behave like wildcard on the left
    if (left === "^") {
      left = `(\^|[\\W\\_])`;
    }
    if (right === "$") {
      right = `(\$|[\\W\\_])`;
    }

    // words have to be splitted and joined with regexps to provide variable glue
    label = label.toLowerCase().split(" ").join(`[\\W]+`);

    const regexp = `${left}${label}${right}`;

    return row("label").downcase().match(regexp);
  }

  /**
   * adds condition to limit the query only to selected ids
   * @param entityIds
   * @returns
   */
  whereEntityIds(entityIds: string[]): SearchQuery {
    this.query = this.query.getAll(r.args(entityIds)) as any;
    return this;
  }

  /**
   * prepares the query according to request
   * @param req
   */
  async fromRequest(req: RequestSearch): Promise<void> {
    if (req.entityIds?.length) {
      this.retainedIdsOrder = req.entityIds;
    }

    if (req.cooccurrenceId) {
      const assocEntityIds = await this.getCooccurredEntitiesIds(
        req.cooccurrenceId
      );
      if (!req.entityIds) {
        req.entityIds = [];
      }
      req.entityIds = req.entityIds.concat(assocEntityIds);
    }

    if (req.entityIds?.length) {
      this.whereEntityIds(req.entityIds);
    }

    if (req.class) {
      this.whereClass(req.class);
    }

    if (req.usedTemplate) {
      this.whereUsedTemplate(req.usedTemplate);
    }

    if (req.onlyTemplates) {
      this.whereIsTemplate();
    }

    if (req.excluded) {
      this.whereNotClass(req.excluded);
    }

    if (req.label) {
      this.whereLabel(req.label);
    }
  }

  /**
   * executes the prepared query
   * @returns list of found entities
   */
  async do(): Promise<IEntity[]> {
    return this.query.run(this.connection);
  }
}

export class ResponseSearch {
  request: RequestSearch;

  constructor(request: RequestSearch) {
    this.request = request;
  }

  /**
   * Prepares asynchronously results data
   * @param db
   */
  async prepare(httpRequest: IRequest): Promise<ResponseEntity[]> {
    const query = new SearchQuery(httpRequest.db.connection);
    await query.fromRequest(this.request);
    let entities = await query.do();

    if (query.retainedIdsOrder) {
      entities = sortByRequiredOrder(entities, query.retainedIdsOrder);
    } else {
      entities = sortByWordMatch(sortByLength(entities), query.usedLabel);
    }

    let out: ResponseEntity[] = [];
    for (const entityData of entities) {
      const response = new ResponseEntity(getEntityClass(entityData));
      await response.prepare(httpRequest);
      out.push(response);
    }

    return out;
  }
}

/**
 * DEPRECATED
 * Sort retrieved entities by label distance or length of the entity label.
 * In case of empty label only the latter will be used (distance will be 0).
 * @param entities original unsorted entities
 * @param label original wanted label
 * @returns sorted entities list
 */
export function sort(entities: IEntity[], label: string = ""): IEntity[] {
  const indexMap: Record<number, IEntity[]> = {};

  // sort by distance from the start
  entities.forEach((e) => {
    let index = e.label.indexOf(label);
    if (index === -1) {
      index = 99999;
    }
    if (!indexMap[index]) {
      indexMap[index] = [];
    }
    indexMap[index].push(e);
  });

  let out: IEntity[] = [];
  const sortedDistances = Object.keys(indexMap)
    .map((d) => parseInt(d))
    .sort((a, b) => a - b);

  for (const key of sortedDistances) {
    indexMap[key].sort((a, b) => a.label.length - b.label.length);
    out = out.concat(indexMap[key]);
  }

  return out;
}

/**
 * Sort entities by length
 * @param entities original unsorted entities
 * @returns sorted entities list
 */
export function sortByLength(entities: IEntity[]) {
  return entities.sort((a, b) => a.label.length - b.label.length);
}

/**
 * Prioritize entities with exact word-match
 * @param entities original unsorted entities
 * @param usedLabel original label
 * @returns sorted entities list
 */
export function sortByWordMatch(
  entities: IEntity[],
  usedLabel: string = ""
): IEntity[] {
  if (!usedLabel) {
    return entities;
  }

  let sortedExact: IEntity[] = [];
  let sortedSubstring: IEntity[] = [];

  for (const entity of entities) {
    if (
      entity.label
        .toLowerCase()
        .match(/[\w]+/g)
        ?.indexOf(usedLabel.toLowerCase()) !== -1
    ) {
      sortedExact.push(entity);
    } else {
      sortedSubstring.push(entity);
    }
  }

  return sortedExact.concat(sortedSubstring);
}

/**
 * Returns entities in wanted order, ignoring ids not in the wanted list
 * @param entities original unsorted entities
 * @param wantedOrder list of ids
 * @returns sorted entities list
 */
export function sortByRequiredOrder(
  entities: IEntity[],
  wantedOrder: string[]
): IEntity[] {
  const newList: IEntity[] = [];
  for (const id of wantedOrder) {
    const found = entities.find((e) => e.id === id);
    if (found) {
      newList.push(found);
    }
  }
  return newList;
}
