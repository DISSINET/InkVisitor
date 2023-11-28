import { EntityEnums } from "@shared/enums";
import { IEntity, IResponseSearchEntity, RequestSearch } from "@shared/types";
import { regExpEscape } from "@common/functions";
import Entity from "./entity";
import Statement from "@models/statement/statement";
import { Connection, r, RDatum, RTable } from "rethinkdb-ts";
import { ResponseEntity } from "./response";
import { getEntityClass } from "@models/factory";
import { IRequest } from "src/custom_typings/request";
import Territory from "@models/territory/territory";
import Audit from "@models/audit/audit";

/**
 * SearchQuery is customized builder for search queries, allowing to build query by chaining prepared filters
 */
export class SearchQuery {
  usedLabel?: string; // used for additional sorting
  retainedIdsOrder?: string[]; // used for additional sorting - to respect provided entityIds

  connection: Connection;
  query: RTable<any>;

  filterUsed?: boolean;

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
   * searches Statements under specific territory and returns ids of all statement entity ids
   * @param territoryId
   * @returns
   */
  async getStatementObjectIdsForTerritories(
    territoryIds: string[]
  ): Promise<string[]> {
    const statements = await Statement.findByTerritoryIds(
      this.connection,
      territoryIds
    );
    const idsMap: Record<string, null> = {};
    for (const st of statements) {
      for (const id of st.getEntitiesIds()) {
        idsMap[id] = null;
      }
    }

    return Object.keys(idsMap);
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

    this.filterUsed = true;
    return this;
  }

  /**
   * adds condition to limit results by filtering by specific status
   * @param entityClass
   * @returns
   */
  whereStatus(status: EntityEnums.Status): SearchQuery {
    this.query = this.query.filter({
      status: status,
    });

    this.filterUsed = true;
    return this;
  }

  /**
   * adds condition to limit results by excluding specific classes
   * @param entityClass
   * @returns
   */
  whereNotClass(entityClass: EntityEnums.Class[]): SearchQuery {
    this.query = this.query.filter(function (row: RDatum) {
      return r.expr(entityClass).contains(row("class")).not();
    });

    this.filterUsed = true;
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

    this.filterUsed = true;
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

    this.filterUsed = true;
    return this;
  }

  /**
   * adds condition to limit results to resources with documentId
   * @returns
   */
  whereResourcesHasDocument(): SearchQuery {
    this.query = this.query.filter(function (row: RDatum) {
      return r.and(
        row("class").eq(EntityEnums.Class.Resource),
        row.hasFields({ data: { documentId: true } }),
        row("data")("documentId").ne("")
      );
    });
    return this;
  }

  /**
   * adds condition to filter entries with language
   * @returns
   */
  whereLanguage(language: EntityEnums.Language): SearchQuery {
    this.query = this.query.filter({
      language: language,
    });

    this.filterUsed = true;
    return this;
  }

  /**
   * adds condition to filter by label
   * @param label
   * @returns
   */
  whereLabel(label: string): SearchQuery {
    let leftWildcard = "^",
      rightWildcard = "$";

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

    this.filterUsed = true;
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
      left = "(^|[\\W\\_])";
    }
    if (right === "$") {
      right = "($|[\\W\\_])";
    }

    // words have to be splitted and joined with regexps to provide variable glue
    label = label.toLowerCase().split(" ").join("([\\W\\_]+[\\w]+)*[\\W\\_]+");

    const regexp = `${left}${label}${right}`;

    return row("label").downcase().match(regexp);
  }

  /**
   * adds condition to limit the query only to selected ids.
   * According to previous filters, it will use filter or getAll method.
   * Note: this filter should be applied last.
   * @param entityIds
   * @returns
   */
  whereEntityIds(entityIds: string[]): SearchQuery {
    if (this.filterUsed) {
      this.query = this.query.filter((row: RDatum) =>
        r.expr(entityIds).contains(row("id"))
      );
    } else {
      this.query = this.query.getAll(r.args(entityIds)) as any;
    }
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

    if (req.territoryId) {
      let territoryIds = [req.territoryId];

      // include childs
      if (req.subTerritorySearch) {
        const childs = Object.values(
          await new Territory({ id: req.territoryId }).findChilds(
            this.connection
          )
        );
        territoryIds = territoryIds.concat(childs.map((ch) => ch.id));
      }

      const assocEntityIds = await this.getStatementObjectIdsForTerritories(
        territoryIds
      );

      if (!req.entityIds) {
        req.entityIds = [];
      }
      req.entityIds = req.entityIds.concat(assocEntityIds);
    }

    if (req.class) {
      this.whereClass(req.class);
    }

    if (req.status) {
      this.whereStatus(req.status);
    }

    if (req.createdDate) {
      const audits = await Audit.getByCreatedDate(
        this.connection,
        req.createdDate
      );
      if (!req.entityIds) {
        req.entityIds = audits.map((a) => a.entityId);
      } else {
        req.entityIds = req.entityIds.reduce((acc, curr) => {
          if (audits.find((a) => a.entityId === curr)) {
            acc.push(curr);
          }
          return acc;
        }, [] as string[]);
      }
    }

    if (req.updatedDate) {
      const audits = await Audit.getByUpdatedDate(
        this.connection,
        req.updatedDate
      );
      if (!req.entityIds) {
        req.entityIds = audits.map((a) => a.entityId);
      } else {
        req.entityIds = req.entityIds.reduce((acc, curr) => {
          if (audits.find((a) => a.entityId === curr)) {
            acc.push(curr);
          }
          return acc;
        }, [] as string[]);
      }
    }

    if (req.usedTemplate) {
      this.whereUsedTemplate(req.usedTemplate);
    }

    if (req.language) {
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

    if (req.entityIds) {
      this.whereEntityIds(req.entityIds);
    }

    console.log(this.query.toString());
  }

  /**
   * executes the prepared query
   * @returns list of found entities
   */
  async do(): Promise<IEntity[]> {
    return this.query.run(this.connection);
  }
}

export class ResponseSearchEntity
  extends ResponseEntity
  implements IResponseSearchEntity
{
  usedAsTemplate: string[];

  constructor(entity: Entity) {
    super(entity);
    this.usedAsTemplate = [];
  }

  /**
   * Loads additional fields to satisfy the IResponseSearchEntity interface
   * @param request
   */
  async prepare(request: IRequest): Promise<void> {
    super.prepare(request);
    this.usedAsTemplate = (await this.findDerived(request.db.connection)).map(
      (c) => c.id
    );
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
  async prepare(httpRequest: IRequest): Promise<ResponseSearchEntity[]> {
    const query = new SearchQuery(httpRequest.db.connection);
    await query.fromRequest(this.request);
    let entities = await query.do();

    if (query.retainedIdsOrder) {
      entities = sortByRequiredOrder(entities, query.retainedIdsOrder);
    } else {
      entities = sortByWordMatch(sortByLength(entities), query.usedLabel);
    }

    const out: ResponseSearchEntity[] = [];
    for (const entityData of entities) {
      const response = new ResponseSearchEntity(getEntityClass(entityData));
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
export function sort(entities: IEntity[], label = ""): IEntity[] {
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
  usedLabel = ""
): IEntity[] {
  if (!usedLabel) {
    return entities;
  }

  const sortedExact: IEntity[] = [];
  const sortedSubstring: IEntity[] = [];

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
