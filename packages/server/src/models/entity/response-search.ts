import { Request } from "express";
import { EntityClass } from "@shared/enums";
import { IEntity, IResponseSearch, RequestSearch } from "@shared/types";
import { regExpEscape } from "@common/functions";
import Entity from "./entity";
import Statement from "@models/statement/statement";
import { Connection, r, RDatum, RStream, RTable } from "rethinkdb-ts";
import { ResponseEntity } from "./response";
import { getEntityClass } from "@models/factory";

/**
 * SearchQuery is customized builder for search queries, allowing to build query by chaining prepared filters
 */
export class SearchQuery {
  connection: Connection;
  query: RTable<any>;

  constructor(conn: Connection) {
    this.connection = conn;
    this.query = r.table(Entity.table);
  }

  /**
   * searches Statements to find all associated entities
   * ids can be then used in whereEntityIds method
   * @param cooccurenceId
   * @returns
   */
  async getAssociatedEntityIds(cooccurenceId: string): Promise<string[]> {
    const associatedEntityIds = await Statement.findIdsByDataEntityId(
      this.connection,
      cooccurenceId
    );

    // entity id provided, but not found within statements - end now
    if (!associatedEntityIds.length) {
      return [];
    }

    // filter out duplicates
    return [...new Set(associatedEntityIds)];
  }

  /**
   * adds condition to limit results by filtering by specific class
   * @param entityClass
   * @returns
   */
  whereClass(entityClass: EntityClass): SearchQuery {
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
  whereNotClass(entityClass: EntityClass[]): SearchQuery {
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
    if (req.cooccurenceId) {
      const assocEntityIds = await this.getAssociatedEntityIds(
        req.cooccurenceId
      );
      this.whereEntityIds(assocEntityIds);
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
  responses: IResponseSearch[];

  constructor(request: RequestSearch) {
    this.request = request;
    this.responses = [];
  }

  /**
   * Prepares asynchronously results data
   * @param db
   */
  async prepare(httpRequest: Request): Promise<void> {
    const query = new SearchQuery(httpRequest.db.connection);
    await query.fromRequest(this.request);
    const entities = await query.do();

    for (const entityData of entities) {
      const response = new ResponseEntity(getEntityClass(entityData));
      await response.prepare(httpRequest);
      this.responses.push(response);
    }
  }

  /**
   *
   * @returns returns prepares list of search entities
   */
  getResults(): IResponseSearch[] {
    return this.responses;
  }
}
