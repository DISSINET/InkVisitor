import Audit from "@models/audit/audit";
import { getEntityClass } from "@models/factory";
import Classification from "@models/relation/classification";
import Statement from "@models/statement/statement";
import Territory from "@models/territory/territory";
import { getEntitiesByIds } from "@service/shorthands";
import treeCache from "@service/treeCache";
import { RelationEnums } from "@inkvisitor/shared/enums";
import { IConcept, IEntity, ITerritory, RequestSearch, AuditScope } from "@inkvisitor/shared/types";
import { PropSpecKind } from "@inkvisitor/shared/types/prop";
import { Conn, storage } from "@service/storage";
import { prepareLabel } from "@common/searchLabel";
import { IRequest } from "src/custom_typings/request";
import Entity from "./entity";
import { ResponseEntity } from "./response";
import { IRequestSearchRootValidity } from "@inkvisitor/shared/types/request-search";
import { Setting } from "@models/setting/setting";
import { ISetting } from "@inkvisitor/shared/types/settings";
import Relation from "@models/relation/relation";
import {
  getEquivalentEntityIds,
  getSubordinateEntityIds,
} from "@models/relation/functions";

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

export interface SearchOutcome {
  entities: IEntity[];
  /** the label the request matched on, for ordering the results */
  usedLabel?: string;
  /** the caller's own id list, for ordering the results the way it was typed */
  retainedIdsOrder?: string[];
}

/**
 * Statements under the territories, as the entity ids they use.
 */
async function getStatementObjectIdsForTerritories(
  conn: Conn,
  territoryIds: string[]
): Promise<string[]> {
  const statements = await Statement.findByTerritoryIds(conn, territoryIds);
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
 * Fetches audits and updates the request's entityIds by intersecting with the
 * audit results.
 * @param req The request search object, will be mutated.
 * @param getAudits A function that returns a promise of audits.
 */
async function updateEntityIdsFromAudits(
  req: RequestSearch,
  getAudits: () => Promise<Audit[]>
): Promise<void> {
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
 * Runs an entity search. The request fields that live in other tables
 * (co-occurrence, territory, audit dates and users) are resolved into
 * `entityIds` first, in this order, then the storage adapter applies the
 * remaining filters. `seedIds` restricts the search to those rows before any
 * filter (used by the equivalents / subordinates expansion).
 */
export async function searchEntities(
  conn: Conn,
  req: RequestSearch,
  opts: { seedIds?: string[] } = {}
): Promise<SearchOutcome> {
  const retainedIdsOrder = req.entityIds?.length ? req.entityIds : undefined;

  if (req.cooccurrenceId) {
    const assocEntityIds = await Statement.getCoOccurrentEntityIds(
      conn,
      req.cooccurrenceId
    );
    if (!req.entityIds) {
      req.entityIds = [];
    }
    req.entityIds = req.entityIds.concat(assocEntityIds);
  }

  if (req.territoryId) {
    let territoryIds = [req.territoryId];

    if (req.subTerritorySearch) {
      const childs = Object.values(
        await new Territory({ id: req.territoryId }).findChilds(conn, true)
      );
      territoryIds = territoryIds.concat(childs.map((ch) => ch.id));
    }

    const assocEntityIds = await getStatementObjectIdsForTerritories(
      conn,
      territoryIds
    );

    if (!req.entityIds) {
      req.entityIds = [];
    }
    req.entityIds = req.entityIds.concat(assocEntityIds);
  }

  if (req.createdAfter || req.createdBefore) {
    await updateEntityIdsFromAudits(req, () =>
      Audit.getByCreatedInRange(
        conn,
        req.createdAfter as Date | undefined,
        req.createdBefore as Date | undefined
      )
    );
  } else if (req.createdDate) {
    await updateEntityIdsFromAudits(req, () =>
      Audit.getByCreatedDate(conn, req.createdDate as Date)
    );
  }

  if (req.updatedAfter || req.updatedBefore) {
    await updateEntityIdsFromAudits(req, () =>
      Audit.getByUpdatedInRange(
        conn,
        req.updatedAfter as Date | undefined,
        req.updatedBefore as Date | undefined
      )
    );
  } else if (req.updatedDate) {
    await updateEntityIdsFromAudits(req, () =>
      Audit.getByUpdatedDate(conn, req.updatedDate as Date)
    );
  }

  if (req.createdBy) {
    await updateEntityIdsFromAudits(req, () =>
      Audit.getByCreatedBy(conn, req.createdBy as string)
    );
  }

  if (req.updatedBy) {
    await updateEntityIdsFromAudits(req, () =>
      Audit.getByUpdatedBy(conn, req.updatedBy as string)
    );
  }

  if (req.editedBy?.length) {
    const auditEntityIdsSet = new Set<string>();
    for (const userId of req.editedBy) {
      const updatedBy = await Audit.getByUpdatedBy(conn, userId);
      const createdBy = await Audit.getByCreatedBy(conn, userId);

      updatedBy
        .concat(createdBy)
        .filter((a) => a.auditScope === AuditScope.Entity)
        .forEach((a) => auditEntityIdsSet.add(a.modelId));
    }

    if (!req.entityIds) {
      req.entityIds = Array.from(auditEntityIdsSet);
    } else {
      req.entityIds = req.entityIds.filter((id) => auditEntityIdsSet.has(id));
    }
  }

  const usedLabel = req.labelOrId
    ? prepareLabel(req.labelOrId)[0]
    : req.label
    ? prepareLabel(req.label)[0]
    : undefined;

  const entities = await storage.entities.search(conn, req, opts);

  return { entities, usedLabel, retainedIdsOrder };
}

export class ResponseSearch {
  request: RequestSearch;

  /**
   * Upper bound on how many base matches are expanded. The related-id lookups do
   * per-entity transitive traversal, so the input is capped; when there are more
   * base matches, only the first ones (as returned by the query) are expanded.
   */
  static EXPANSION_CAP = 100;

  constructor(request: RequestSearch) {
    this.request = request;
  }

  /**
   * Mixes entities surfaced by the expansion options - "include equivalents"
   * (SYN/IDE/AEE) and/or "include subordinates" (inverse SCL/SOE/HOL + child
   * territories) - into the base result set (#2969). For each enabled option the
   * related ids of the base matches are collected and the search is re-run for
   * those ids with the label dropped but every other condition reapplied, so
   * expanded entities are only kept if they meet the other conditions. Returns
   * the merged (deduped) entities plus the id sets that came in via each option,
   * used to mark them in the response.
   * @param conn db connection
   * @param request original search request
   * @param baseEntities entities matched by the original (label) search
   */
  static async expandResults(
    conn: Conn,
    request: RequestSearch,
    baseEntities: IEntity[]
  ): Promise<{
    entities: IEntity[];
    equivalentIds: Set<string>;
    subordinateIds: Set<string>;
  }> {
    const idsToExpand = baseEntities
      .slice(0, ResponseSearch.EXPANSION_CAP)
      .map((e) => e.id);
    const seen = new Set(baseEntities.map((e) => e.id));
    const entities = [...baseEntities];
    const equivalentIds = new Set<string>();
    const subordinateIds = new Set<string>();

    const expansions: Array<
      [(c: Conn, ids: string[]) => Promise<string[]>, Set<string>]
    > = [];
    if (request.includeEquivalents) {
      expansions.push([getEquivalentEntityIds, equivalentIds]);
    }
    if (request.includeSubordinates) {
      expansions.push([getSubordinateEntityIds, subordinateIds]);
    }

    for (const [getRelatedIds, target] of expansions) {
      const relatedIds = (await getRelatedIds(conn, idsToExpand)).filter(
        (id) => !seen.has(id)
      );
      if (!relatedIds.length) {
        continue;
      }

      // Reapply every condition except the label match: start from a
      // primary-index lookup of the related ids, force filterUsed so fromRequest
      // layers the remaining conditions (class/status/territory/cooccurrence/
      // audit...) on top as intersecting filters.
      const expansionRequest = new RequestSearch({
        ...request,
        label: undefined,
        labelOrId: undefined,
        entityIds: undefined,
        includeEquivalents: false,
        includeSubordinates: false,
      });
      const { entities: found } = await searchEntities(conn, expansionRequest, {
        seedIds: relatedIds,
      });

      for (const entity of found) {
        if (!seen.has(entity.id)) {
          seen.add(entity.id);
          target.add(entity.id);
          entities.push(entity);
        }
      }
    }

    return { entities, equivalentIds, subordinateIds };
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
    conn: Conn,
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
    const settings = await Setting.getSettingsAll(httpRequest.db.connection);
    const { entities: found, usedLabel, retainedIdsOrder } = await searchEntities(
      httpRequest.db.connection,
      this.request
    );
    let entities = found;

    // mix in equivalents/subordinates of the direct matches (#2969); the
    // returned id sets flag which results were added by each option
    let equivalentIds: Set<string> | undefined;
    let subordinateIds: Set<string> | undefined;
    if (
      (this.request.includeEquivalents || this.request.includeSubordinates) &&
      entities.length
    ) {
      ({ entities, equivalentIds, subordinateIds } =
        await ResponseSearch.expandResults(
          httpRequest.db.connection,
          this.request,
          entities
        ));
    }

    entities = await ResponseSearch.filterEntitiesByRootValidity(
      httpRequest.db.connection,
      entities,
      this.request.isRootInvalid ?? IRequestSearchRootValidity.Any,
      settings
    );

    if (retainedIdsOrder) {
      entities = sortByRequiredOrder(entities, retainedIdsOrder);
    } else {
      entities = sortByWordMatch(sortByLength(entities), usedLabel);
    }

    const out: ResponseEntity[] = [];
    for (const entityData of entities) {
      const response = new ResponseEntity(getEntityClass(entityData));
      await response.prepare(httpRequest);
      if (equivalentIds?.has(entityData.id)) {
        response.isEquivalent = true;
      } else if (subordinateIds?.has(entityData.id)) {
        response.isSubordinate = true;
      }
      out.push(response);
    }

    // stamp document anchor spans onto statement results so tags can show
    // them as labels (response-only field, see IEntity.anchorTexts). Must run
    // on the wrapped responses: getEntityClass re-instantiates the entity via
    // fillFlatObject, which drops undeclared fields - stamping the raw
    // entities beforehand would be lost.
    await Entity.applyAnchorTexts(httpRequest.db.connection, out);

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
