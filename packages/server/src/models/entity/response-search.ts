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
   * @param entityId
   * @returns
   */
  async getAssociatedEntityIds(entityId: string): Promise<string[]> {
    const associatedEntityIds = await Statement.findIdsByDataEntityId(
      this.connection,
      entityId
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

    this.query = this.query.filter(function (row: RDatum) {
      return r.or(
        SearchQuery.searchWordByWord(row, label)
        // SearchQuery.searchByString(row, label, leftWildcard, rightWildcard)
      );
    });

    return this;
  }

  public static searchByString(
    row: RDatum,
    label: string,
    right: string,
    left: string
  ): RDatum {
    // escape problematic chars - messes with regexp search
    label = regExpEscape(label.toLowerCase());

    return row("label").downcase().match(`${left}${label}${right}`);
  }

  public static searchWordByWord(row: RDatum, label: string): RDatum {
    // words have to be splitted and joined with regexps to provide variable glue
    label = label.toLowerCase().split(" ").join("[ .,_:]");
    const regexp = `(^|\W )${label}($|\W)`;
    console.log(regexp);
    return row("label").downcase().match(regexp);
  }

  public static searchByWords(row: RDatum, label: string): RDatum {
    // word search require regexp like '(word1)|(word2)|(word3)'
    const labelWords = label
      .split(" ")
      .map((word) => `(${word})`)
      .join("&");
    // full regexp needs to encompass also cases like `[woman`, or `Arnalda,`
    // which are common return values from split call
    const regexp = `^([\[ ,])?${labelWords}([\] ,])?$`;

    console.log(labelWords);
    return row("label")
      .downcase()
      .split()
      .contains(function (split) {
        return split.match(regexp);
      });
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

    if (req.entityId) {
      const assocEntityIds = await this.getAssociatedEntityIds(req.entityId);
      this.whereEntityIds(assocEntityIds);
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
