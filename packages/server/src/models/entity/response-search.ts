import Audit from "@models/audit/audit";
import Document from "@models/document/document";
import { getEntityClass } from "@models/factory";
import Classification from "@models/relation/classification";
import Statement from "@models/statement/statement";
import Territory from "@models/territory/territory";
import { getEntitiesByIds } from "@service/shorthands";
import treeCache from "@service/treeCache";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IConcept, IEntity, ITerritory, RequestSearch, AuditScope } from "@inkvisitor/shared/types";
import { PropSpecKind } from "@inkvisitor/shared/types/prop";
import { Connection, r, RDatum, RTable } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Entity from "./entity";
import { ResponseEntity } from "./response";
import { IRequestSearchRootValidity } from "@inkvisitor/shared/types/request-search";
import { Setting } from "@models/setting/setting";
import { ISetting } from "@inkvisitor/shared/types/settings";
import Relation from "@models/relation/relation";
import { getEquivalentEntityIds } from "@models/relation/functions";

/**
 * Statement.getEntitiesIds() appends territory lineage (ancestors toward root) for other features.
 * Territory search aggregates those ids; strip ancestor territory ids so the root (or any parent T)
 * is not implied when filtering by a child territory.
 */
function stripAncestorTerritoryIdsFromStatementLineage(
  statementTerritoryId: string | undefined,
  entityIds: Record<string, null>
): void {
  if (!statementTerritoryId) {
    return;
  }
  const path = treeCache.tree.idMap[statementTerritoryId]?.path;
  if (!path?.length) {
    return;
  }
  for (const ancestorId of path) {
    delete entityIds[ancestorId];
  }
}

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
      stripAncestorTerritoryIdsFromStatementLineage(
        st.data.territory?.territoryId,
        idsMap
      );
    }

    return Object.keys(idsMap);
  }

  /**
   * adds condition to limit results by filtering by specific class
   * @param entityClass
   * @returns
   */
  whereClass(
    entityClass: EntityEnums.Class | EntityEnums.Extension.Any
  ): SearchQuery {
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
        row("data")("documentId").ne(""),
        r.table(Document.table).get(row("data")("documentId")).ne(null)
      );
    });
    return this;
  }

  /**
   * adds condition to search for entities which have reference to chosen resource id
   * @returns
   */
  whereHaveReferenceTo(refId: string): SearchQuery {
    this.query = this.query.filter(function (row: RDatum) {
      return row("references").contains(function (ref: RDatum) {
        return ref("resource").eq(refId);
      });
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
   * prepares label for search
   * @param label
   * @returns
   */
  public static prepareLabel(label: string): [string, string, string] {
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
    // escape problematic chars - messes with regexp search
    // label = regExpEscape(label.toLowerCase());

    return [label, leftWildcard, rightWildcard];
  }

  prepareLabel(label: string): [string, string, string] {
    return SearchQuery.prepareLabel(label);
  }

  /**
   * adds condition to filter by label
   * @param label
   * @returns
   */
  whereLabel(label: string): SearchQuery {
    const [preparedLabel, leftWildcard, rightWildcard] =
      this.prepareLabel(label);

    this.usedLabel = preparedLabel;

    this.query = this.query.filter(function (row: RDatum) {
      return SearchQuery.searchWordByWord(
        row,
        preparedLabel,
        leftWildcard,
        rightWildcard
      );
    });

    this.filterUsed = true;
    return this;
  }

  /**
   * adds condition to filter by label or id
   * @param label
   * @returns
   */
  whereLabelOrId(labelOrId: string): SearchQuery {
    const [label, leftWildcard, rightWildcard] = this.prepareLabel(labelOrId);
    this.usedLabel = label;

    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // id is matched as a prefix of the literal input — strip the trailing
    // wildcard the client appends, then escape regex chars and anchor at start
    const idPrefix = labelOrId.replace(/\*$/, "");
    const escapedIdPrefix = idPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // search 3 times:
    // 1. search for exact word match with some normalization
    // 2. search for exact word match without normalization
    // 3. search for id prefix match
    this.query = this.query.filter(function (row: RDatum) {
      return r.or(
        SearchQuery.searchWordByWord(
          row,
          escapedLabel,
          leftWildcard,
          rightWildcard
        ),
        SearchQuery.searchWordByWord(
          row,
          escapedLabel,
          leftWildcard,
          rightWildcard,
          false
        ),
        row("id").match("^" + escapedIdPrefix).ne(null)
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
   * @param normalize - if true, the label will be normalized to remove diacritics and convert to lowercase
   * @returns filtration statement for RDatum
   */
  public static searchWordByWord(
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

    return row("labels").contains<string>((targetLabel) =>
      targetLabel.match(regexp)
    );
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
   * Fetches audits and updates the request's entityIds by intersecting with the audit results.
   * This is a helper to abstract away the repeated logic for filtering by audit data.
   * It also improves performance by using a Set for intersection.
   * @param req The request search object, will be mutated.
   * @param getAudits A function that returns a promise of audits.
   */
  private async _updateEntityIdsFromAudits(
    req: RequestSearch,
    getAudits: () => Promise<Audit[]>
  ) {
    const audits = await getAudits();
    const auditEntityIds = audits
      .filter((a) => a.auditScope === AuditScope.Entity)
      .map((a) => a.modelId);

    if (!req.entityIds) {
      req.entityIds = auditEntityIds;
    } else {
      const auditEntityIdsSet = new Set(auditEntityIds);
      req.entityIds = req.entityIds.filter((id) => auditEntityIdsSet.has(id));
    }
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
      const assocEntityIds = await Statement.getCoOccurrentEntityIds(
        this.connection,
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
            this.connection,
            true
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

    if (req.createdAfter || req.createdBefore) {
      await this._updateEntityIdsFromAudits(req, () =>
        Audit.getByCreatedInRange(
          this.connection,
          req.createdAfter as Date | undefined,
          req.createdBefore as Date | undefined,
        )
      );
    } else if (req.createdDate) {
      await this._updateEntityIdsFromAudits(req, () =>
        Audit.getByCreatedDate(this.connection, req.createdDate as Date)
      );
    }

    if (req.updatedAfter || req.updatedBefore) {
      await this._updateEntityIdsFromAudits(req, () =>
        Audit.getByUpdatedInRange(
          this.connection,
          req.updatedAfter as Date | undefined,
          req.updatedBefore as Date | undefined,
        )
      );
    } else if (req.updatedDate) {
      await this._updateEntityIdsFromAudits(req, () =>
        Audit.getByUpdatedDate(this.connection, req.updatedDate as Date)
      );
    }

    if (req.createdBy) {
      await this._updateEntityIdsFromAudits(req, () =>
        Audit.getByCreatedBy(this.connection, req.createdBy as string)
      );
    }

    if (req.updatedBy) {
      await this._updateEntityIdsFromAudits(req, () =>
        Audit.getByUpdatedBy(this.connection, req.updatedBy as string)
      );
    }

    if (req.editedBy) {
      const updatedBy = await Audit.getByUpdatedBy(
        this.connection,
        req.editedBy as string
      );
      const createdBy = await Audit.getByCreatedBy(
        this.connection,
        req.editedBy as string
      );

      const auditEntityIds = updatedBy
        .concat(createdBy)
        .filter((a) => a.auditScope === AuditScope.Entity)
        .map((a) => a.modelId);

      if (!req.entityIds) {
        req.entityIds = auditEntityIds;
      } else {
        const auditEntityIdsSet = new Set(auditEntityIds);
        req.entityIds = req.entityIds.filter((id) => auditEntityIdsSet.has(id));
      }
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
    //  console.log(this.query.toString());
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

  /**
   * Upper bound on how many base matches are expanded into equivalents when
   * `includeEquivalents` is set. SYN/AEE are batched and cheap, but IDE does a
   * per-entity transitive traversal, so we cap the input. When there are more
   * base matches, only the first ones (as returned by the query) are expanded.
   */
  static EQUIVALENTS_EXPANSION_CAP = 100;

  constructor(request: RequestSearch) {
    this.request = request;
  }

  /**
   * Mixes "equivalent" entities (SYN/IDE/AEE, see getEquivalentEntityIds) of the
   * base matches into the result set for the "include equivalents" option
   * (#2969). Equivalents are only kept if they satisfy every non-label condition
   * of the original request - this is enforced by re-running the search for the
   * equivalent ids with the label condition dropped and all other conditions
   * reapplied. Returns the base entities followed by the new equivalents, deduped.
   * @param conn db connection
   * @param request original search request
   * @param baseEntities entities matched by the original (label) search
   */
  static async addEquivalents(
    conn: Connection,
    request: RequestSearch,
    baseEntities: IEntity[]
  ): Promise<IEntity[]> {
    const baseIds = new Set(baseEntities.map((e) => e.id));
    const idsToExpand = baseEntities
      .slice(0, ResponseSearch.EQUIVALENTS_EXPANSION_CAP)
      .map((e) => e.id);

    const equivalentIds = (
      await getEquivalentEntityIds(conn, idsToExpand)
    ).filter((id) => !baseIds.has(id));

    if (!equivalentIds.length) {
      return baseEntities;
    }

    // Reapply every condition except the label match: start from a primary-index
    // lookup of the equivalent ids, force filterUsed so fromRequest layers the
    // remaining conditions (class/status/territory/cooccurrence/audit...) on top
    // as intersecting filters.
    const equivalentsRequest = new RequestSearch({
      ...request,
      label: undefined,
      labelOrId: undefined,
      entityIds: undefined,
      includeEquivalents: false,
    });
    const equivalentsQuery = new SearchQuery(conn);
    equivalentsQuery.whereEntityIds(equivalentIds);
    equivalentsQuery.filterUsed = true;
    await equivalentsQuery.fromRequest(equivalentsRequest);
    const equivalentEntities = await equivalentsQuery.do();

    const merged = [...baseEntities];
    for (const entity of equivalentEntities) {
      if (!baseIds.has(entity.id)) {
        baseIds.add(entity.id);
        merged.push(entity);
      }
    }
    return merged;
  }

  /**
   * Pure decision: does an entity pass the root-validity filter?
   * Valid -> no warnings; Invalid -> has warnings; anything else -> pass.
   */
  static passesRootValidity(
    hasWarnings: boolean,
    validity: IRequestSearchRootValidity
  ): boolean {
    if (validity === IRequestSearchRootValidity.Valid) {
      return !hasWarnings;
    }
    if (validity === IRequestSearchRootValidity.Invalid) {
      return hasWarnings;
    }
    return true;
  }

  /**
   * Narrows a list of entities by their root-territory validity (T-based warnings).
   * Returns the input unchanged unless validity is Valid or Invalid.
   * Shared by the Search box (ResponseSearch.prepare) and the Explorer filter.
   */
  static async filterEntitiesByRootValidity(
    conn: Connection,
    entities: IEntity[],
    validity: IRequestSearchRootValidity,
    settings: ISetting[]
  ): Promise<IEntity[]> {
    if (
      validity !== IRequestSearchRootValidity.Valid &&
      validity !== IRequestSearchRootValidity.Invalid
    ) {
      return entities;
    }

    const rootT = treeCache.tree.getRootTerritory() as ITerritory;

    // Used to be a serial nested loop: N entities x 5 awaits each. Fan
    // out the per-entity work in parallel, and inside each entity, run
    // the 3 independent fetches concurrently before resolving the 2
    // entity lookups that depend on their result ids. Promise.all keeps
    // the original order, which callers (e.g. the Explorer filter) rely on.
    const checked = await Promise.all(
      entities.map(async (entity) => {
        const [classificationRels, soeRels, propValueEs] = await Promise.all([
          Classification.getClassificationForwardConnections(
            conn,
            entity.id,
            entity.class,
            1,
            0
          ),
          Relation.findForEntities(
            conn,
            [entity.id],
            RelationEnums.Type.SuperordinateEntity,
            0
          ),
          getEntitiesByIds<IEntity>(
            conn,
            Entity.extractIdsFromProps(entity.props, [PropSpecKind.VALUE])
          ),
        ]);

        const [classificationEs, soeEs] = await Promise.all([
          getEntitiesByIds<IConcept>(
            conn,
            classificationRels.map((c) => c.entityIds[1])
          ),
          getEntitiesByIds<IEntity>(
            conn,
            soeRels.map((s) => s.entityIds[1])
          ),
        ]);

        const warnings = new Entity(entity).getTBasedWarnings(
          [rootT],
          classificationEs,
          soeEs,
          propValueEs,
          settings
        );
        return { entity, hasWarnings: warnings.length > 0 };
      })
    );

    return checked
      .filter(({ hasWarnings }) =>
        ResponseSearch.passesRootValidity(hasWarnings, validity)
      )
      .map(({ entity }) => entity);
  }

  /**
   * Prepares asynchronously results data
   * @param db
   */
  async prepare(httpRequest: IRequest): Promise<ResponseEntity[]> {
    const query = new SearchQuery(httpRequest.db.connection);
    const settings = await Setting.getSettingsAll(httpRequest.db.connection);
    await query.fromRequest(this.request);
    let entities = await query.do();

    // ids that matched the query directly - everything added afterwards is an
    // equivalent (SYN/IDE/AEE) and gets flagged for the UI
    let baseMatchIds: Set<string> | undefined;
    if (this.request.includeEquivalents && entities.length) {
      baseMatchIds = new Set(entities.map((e) => e.id));
      entities = await ResponseSearch.addEquivalents(
        httpRequest.db.connection,
        this.request,
        entities
      );
    }

    entities = await ResponseSearch.filterEntitiesByRootValidity(
      httpRequest.db.connection,
      entities,
      this.request.isRootInvalid ?? IRequestSearchRootValidity.Any,
      settings
    );

    if (query.retainedIdsOrder) {
      entities = sortByRequiredOrder(entities, query.retainedIdsOrder);
    } else {
      entities = sortByWordMatch(sortByLength(entities), query.usedLabel);
    }

    const out: ResponseEntity[] = [];
    for (const entityData of entities) {
      const response = new ResponseEntity(getEntityClass(entityData));
      await response.prepare(httpRequest);
      if (baseMatchIds && !baseMatchIds.has(entityData.id)) {
        response.isEquivalent = true;
      }
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
    let index = e.labels[0].indexOf(label);
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
    indexMap[key].sort((a, b) => a.labels[0].length - b.labels[0].length);
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
  return entities.sort((a, b) => a.labels[0].length - b.labels[0].length);
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
      entity.labels.length > 0 &&
      entity.labels[0]
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
