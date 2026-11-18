import Audit from "@models/audit/audit";
import Entity from "@models/entity/entity";
import Relation from "@models/relation/relation";
import Statement from "@models/statement/statement";
import treeCache from "@service/treeCache";
import User from "@models/user/user";
import { conceptPartOfSpeechDict, actionPartOfSpeechDict, entityStatusDict, languageDict, actantLogicalTypeDict, entitiesDictKeys } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IStatement, ITerritory, IUser, Relation as RelationTypes } from "@inkvisitor/shared/types";
import { PropSpecKind } from "@inkvisitor/shared/types/prop";
import { Explore } from "@inkvisitor/shared/types/query";
import { Conn, storage } from "@service/storage";
import { filterEntityIdsByRowLabelFilter, getRowLabelFilter } from "./explore-label-filter";
import { applyRowIdsFilter, getRowIdsFilter } from "./explore-ids-filter";
import {
  applyCoOccurrenceFilter,
  getCoOccurrenceFilter,
} from "./explore-cooccurrence-filter";
import { applyRequestSearchFilters } from "./explore-to-request-search";
import { applyRootValidityFilter, getRootValidityFilter } from "./explore-root-validity-filter";

/**
 * Column data shared by every row of one page, resolved in a single pass before
 * the row loop so a column backed by its own query does not repeat that query
 * per row.
 */
export interface IColumnsContext {
  /** row entity id -> first-level territories its statements sit under (EUI) */
  usedInTerritories: Record<string, IEntity[]>;
  /** every entity a column of the page points at, by id */
  entities: Map<string, IEntity>;
  /** ER column id -> row entity id -> ids linked in the column's direction, in relation order */
  related: Map<string, Map<string, string[]>>;
  /** row entity id -> the user behind its first audit */
  creators: Map<string, IUser>;
}

/** the territory a territory hangs under or a statement is placed in */
const parentTerritoryId = (entity: IEntity): string | undefined => {
  if (entity.class === EntityEnums.Class.Territory) {
    const parent = (entity as ITerritory).data.parent;
    return parent ? parent.territoryId : undefined;
  }
  if (entity.class === EntityEnums.Class.Statement) {
    return (entity as IStatement).data.territory?.territoryId;
  }
  return undefined;
};

/** the ids of the entities an entity-valued column shows for the row `entity`; none for any other column */
function linkedIds(
  entity: IEntity,
  column: Explore.IExploreColumn,
  related: IColumnsContext["related"]
): string[] {
  switch (column.type) {
    // Entity Property value
    case Explore.EExploreColumnType.EPV: {
      const { propertyType } = column.params as Explore.IExploreColumnParams<Explore.EExploreColumnType.EPV>;
      const ids = new Set<string>();
      for (const prop of entity.props) {
        if (prop.type.entityId === propertyType && prop.value && prop.value.entityId) {
          ids.add(prop.value.entityId);
        }
      }
      return [...ids];
    }
    // Entity Reference Resources
    case Explore.EExploreColumnType.ERR:
      return entity.references.map((reference) => reference.resource);
    // Entity Reference Values
    case Explore.EExploreColumnType.ERV: {
      const { resource } = column.params as Explore.IExploreColumnParams<Explore.EExploreColumnType.ERV>;
      const ids = new Set<string>();
      for (const reference of entity.references) {
        if (reference.resource === resource && reference.value) {
          ids.add(reference.value);
        }
      }
      return [...ids];
    }
    // Entity Property types
    case Explore.EExploreColumnType.EPT:
      return Entity.extractIdsFromProps(entity.props, [PropSpecKind.TYPE]);
    // Entity Relations
    case Explore.EExploreColumnType.ER:
      return related.get(column.id)?.get(entity.id) ?? [];
    // Entity Parent Territory
    case Explore.EExploreColumnType.EPRT: {
      const parentId = parentTerritoryId(entity);
      return parentId ? [parentId] : [];
    }
    default:
      return [];
  }
}

/**
 * row id -> the ids its relations link it to in the asked direction, each once in relation
 * order, without the row itself; `relations` are the ones touching any of the rows
 */
function relatedIds(
  rowIds: string[],
  relations: RelationTypes.IRelation[],
  inverse: boolean
): Map<string, string[]> {
  const rows = new Set(rowIds);
  const linked = new Map<string, Set<string>>();
  for (const relation of relations) {
    for (const rowId of new Set(relation.entityIds)) {
      if (!rows.has(rowId) || !Relation.isInDirection(relation, rowId, inverse)) {
        continue;
      }
      const ids = linked.get(rowId) ?? new Set<string>();
      linked.set(rowId, ids);
      for (const id of relation.entityIds) {
        ids.add(id);
      }
    }
  }
  const out = new Map<string, string[]>();
  for (const [rowId, ids] of linked) {
    ids.delete(rowId);
    out.set(rowId, [...ids]);
  }
  return out;
}

/** row id -> the user behind its first audit, for the rows whose audit and user both exist */
async function firstAuditUsers(db: Conn, rowIds: string[]): Promise<Map<string, IUser>> {
  const audits = await Audit.getFirstForEntities(db, rowIds);
  const users = new Map<string, IUser | null>();
  const out = new Map<string, IUser>();
  for (const audit of audits) {
    if (!audit.user) {
      continue;
    }
    if (!users.has(audit.user)) {
      users.set(audit.user, await User.findUserById(db, audit.user));
    }
    const user = users.get(audit.user);
    if (user) {
      out.set(audit.modelId, user);
    }
  }
  return out;
}

export default class Results<T extends { id: string }> {
  items: string[] | null = null;

  /**
   * Add results from single results batch (edge to be precise) with AND logic: searching for intersection between all results, in other words
   * items argument should be present in previous accumulator
   * @param results
   */
  addAnd(results: string[]) {
    if (!this.items) {
      this.items = results;
      return;
    }

    const newFinals: string[] = [];
    for (const finalItem of this.items) {
      for (const newItem of results) {
        if (finalItem === newItem) {
          newFinals.push(finalItem);
          break;
        }
      }
    }

    this.items = newFinals;
  }

  /**
   * Add results from single results batch (edge to be precise) with AND logic: adding all unique items from all batch results
   * @param results
   */
  addOr(results: string[]) {
    this.items = Array.from(new Set((this.items || []).concat(results)));
  }

  async applyExploreFilters(db: Conn, exploreData: Explore.IExplore): Promise<void> {
    if (!this.items?.length) {
      return;
    }

    // 1. UUIDs (in-memory)
    const rowIdsFilter = getRowIdsFilter(exploreData.filters);
    if (rowIdsFilter?.ids.length) {
      this.items = applyRowIdsFilter(this.items, rowIdsFilter);
      if (!this.items.length) {
        return;
      }
    }

    // 2. Co-occurrence (one indexed statement query, independent of the
    //    candidate count) - runs before the per-candidate filters below.
    const coOccurrenceFilter = getCoOccurrenceFilter(exploreData.filters);
    if (coOccurrenceFilter?.entityIds.length) {
      this.items = await applyCoOccurrenceFilter(db, this.items, coOccurrenceFilter);
      if (!this.items.length) {
        return;
      }
    }

    // 3. Label (db regex / wildcard)
    const rowLabelFilter = getRowLabelFilter(exploreData.filters);
    if (rowLabelFilter?.label?.trim()) {
      this.items = await filterEntityIdsByRowLabelFilter(db, this.items, rowLabelFilter);
      if (!this.items.length) {
        return;
      }
    }

    // 4. Status, language, logical type and part of speech, tested as the
    //    node filters test them. Order of the items is preserved.
    const attributeParams = Explore.attributeFilterParams(exploreData.filters);
    if (Object.keys(attributeParams).length) {
      const passing = new Set(await storage.explore.filterIds(db, this.items, attributeParams));
      this.items = this.items.filter((id) => passing.has(id));
      if (!this.items.length) {
        return;
      }
    }

    // 5. Search-box filters (dates, created/updated/edited by) reused via the
    //    existing SearchQuery backend.
    this.items = await applyRequestSearchFilters(db, this.items, exploreData.filters);
    if (!this.items.length) {
      return;
    }

    // 6. Root validity (most expensive: per-entity relation queries) - run last
    //    on the smallest candidate set.
    const rootValidityFilter = getRootValidityFilter(exploreData.filters);
    if (rootValidityFilter) {
      this.items = await applyRootValidityFilter(db, this.items, rootValidityFilter);
    }
  }

  /**
   * Order items to follow the order of the provided ids (the order the user typed
   * them into the Explore UUIDs filter). Matching is case-insensitive; item casing
   * is preserved. Ids not present in items are skipped, and any items not present in
   * the id list are appended last in their original relative order (defensive: after
   * the UUIDs intersection there should be none).
   */
  orderByIds(ids: string[]): void {
    if (!this.items || !this.items.length) {
      return;
    }

    const itemByLowerId = new Map<string, string>();
    for (const item of this.items) {
      const key = item.toLowerCase();
      if (!itemByLowerId.has(key)) {
        itemByLowerId.set(key, item);
      }
    }

    const ordered: string[] = [];
    const usedKeys = new Set<string>();

    for (const id of ids) {
      const key = id.toLowerCase();
      const item = itemByLowerId.get(key);
      if (item !== undefined && !usedKeys.has(key)) {
        ordered.push(item);
        usedKeys.add(key);
      }
    }

    for (const item of this.items) {
      const key = item.toLowerCase();
      if (!usedKeys.has(key)) {
        ordered.push(item);
        usedKeys.add(key);
      }
    }

    this.items = ordered;
  }

  sort(sortData: Explore.IExploreColumnSort | undefined): void {
    if (!this.items || !this.items.length) {
      return;
    }

    // TODO: implement sorting

    // Temporary solution
    const sortedItems = [...this.items];
    sortedItems.sort((a, b) => {
      return a > b ? 1 : -1;
    });

    this.items = sortedItems;
  }

  filter(exploreData: Explore.IExplore): string[] {
    if (!this.items || !this.items.length) {
      return [];
    }

    if (exploreData.offset >= this.items.length) return [];

    // return all items if limit is 0
    if (exploreData.limit === 0) return this.items;

    const endIndex = Math.min(exploreData.offset + exploreData.limit, this.items.length);

    return this.items.slice(exploreData.offset, endIndex);
  }

  /**
   * Resolves the column data of the rows about to be returned, one read per column type
   * whatever the number of rows. Only the columns actually configured are prepared, so a view
   * without them costs nothing.
   */
  async prepareColumnsContext(
    db: Conn,
    entities: IEntity[],
    columnsData: Explore.IExploreColumn[]
  ): Promise<IColumnsContext> {
    const context: IColumnsContext = {
      usedInTerritories: {},
      entities: new Map(),
      related: new Map(),
      creators: new Map(),
    };
    if (!entities.length) {
      return context;
    }
    const rowIds = entities.map((entity) => entity.id);
    const wants = (type: Explore.EExploreColumnType) => columnsData.some((column) => column.type === type);

    for (const column of columnsData) {
      if (column.type === Explore.EExploreColumnType.ER) {
        const params = column.params as Explore.IExploreColumnParams<Explore.EExploreColumnType.ER>;
        const relations = await Relation.findForEntities(db, rowIds, params.relationType);
        context.related.set(column.id, relatedIds(rowIds, relations, params.inverse === true));
      }
    }

    const linked = new Set<string>();
    for (const entity of entities) {
      for (const column of columnsData) {
        for (const id of linkedIds(entity, column, context.related)) {
          if (id) {
            linked.add(id);
          }
        }
      }
    }
    for (const entity of await Entity.findEntitiesByIds(db, [...linked])) {
      context.entities.set(entity.id, entity);
    }

    if (wants(Explore.EExploreColumnType.EUC)) {
      context.creators = await firstAuditUsers(db, rowIds);
    }

    if (wants(Explore.EExploreColumnType.EUI)) {
      context.usedInTerritories = await this.usedInTerritories(db, rowIds);
    }

    return context;
  }

  /** row id -> first-level territories its statements sit under (EUI) */
  private async usedInTerritories(db: Conn, rowIds: string[]): Promise<Record<string, IEntity[]>> {
    const territoryIdsByRow = await Statement.findUsedInTerritoryIds(db, rowIds);

    const firstLevelIdsByRow: Record<string, Record<string, null>> = {};
    const allFirstLevelIds: Record<string, null> = {};

    for (const [entityId, territoryIds] of Object.entries(territoryIdsByRow)) {
      for (const territoryId of territoryIds) {
        const firstLevelId = treeCache.getFirstLevelTerritoryId(territoryId);
        if (!firstLevelId) {
          continue;
        }
        if (!firstLevelIdsByRow[entityId]) {
          firstLevelIdsByRow[entityId] = {};
        }
        firstLevelIdsByRow[entityId][firstLevelId] = null;
        allFirstLevelIds[firstLevelId] = null;
      }
    }

    // the same handful of first-level territories serves the whole page
    const territories = await Entity.findEntitiesByIds(
      db,
      Object.keys(allFirstLevelIds)
    );
    const territoryById: Record<string, IEntity> = {};
    for (const territory of territories) {
      territoryById[territory.id] = territory;
    }

    const out: Record<string, IEntity[]> = {};
    for (const [entityId, ids] of Object.entries(firstLevelIdsByRow)) {
      out[entityId] = Object.keys(ids)
        .map((id) => territoryById[id])
        .filter((territory) => !!territory);
    }
    return out;
  }

  /** the cells of one row, read from the context prepareColumnsContext built for its page */
  columns(
    entity: IEntity,
    columnsData: Explore.IExploreColumn[],
    context: IColumnsContext
  ): Record<string, IEntity | IEntity[] | number | number[] | string | string[] | IUser | IUser[]> {
    const out: Record<
      string,
      IEntity | IEntity[] | number | number[] | string | string[] | IUser | IUser[]
    > = {};
    // input order and repeats kept, ids without an entity dropped, as findEntitiesByIds returns them
    const linkedEntities = (column: Explore.IExploreColumn): IEntity[] =>
      linkedIds(entity, column, context.related)
        .map((id) => context.entities.get(id))
        .filter((linked): linked is IEntity => !!linked);

    for (const column of columnsData) {
      switch (column.type) {
        case Explore.EExploreColumnType.EPV:
        case Explore.EExploreColumnType.ERR:
        case Explore.EExploreColumnType.ERV:
        case Explore.EExploreColumnType.EPT:
        case Explore.EExploreColumnType.ER: {
          out[column.id] = linkedEntities(column);
          break;
        }
        // Created by
        case Explore.EExploreColumnType.EUC: {
          const user = context.creators.get(entity.id);
          if (user) {
            out[column.id] = user;
          }
          break;
        }
        // Entity Parent Territory
        case Explore.EExploreColumnType.EPRT: {
          const [parentTerritory] = linkedEntities(column);
          if (parentTerritory) {
            out[column.id] = parentTerritory;
          }
          break;
        }
        // Entity Legacy ID
        case Explore.EExploreColumnType.ELI: {
          out[column.id] = entity.legacyId || "";
          break;
        }
        // Entity Status
        case Explore.EExploreColumnType.EST: {
          const statusLabel = entityStatusDict.find((d) => d.value === entity.status)?.label;
          out[column.id] = statusLabel || "";
          break;
        }
        // Entity Label Language
        case Explore.EExploreColumnType.ELA: {
          const langLabel = languageDict.find((d) => d.value === entity.language)?.label;
          out[column.id] = langLabel || "";
          break;
        }
        // Entity Alt Labels
        case Explore.EExploreColumnType.EAL: {
          out[column.id] = (entity.labels ?? []).slice(1).join(", ");
          break;
        }
        // Entity Part of Speech
        case Explore.EExploreColumnType.EPOS: {
          const pos = (entity.data as any)?.pos;
          const posDict = [...conceptPartOfSpeechDict, ...actionPartOfSpeechDict];
          const posLabel = posDict.find((d) => d.value === pos)?.label;
          out[column.id] = posLabel || pos || "";
          break;
        }
        // Entity Detail
        case Explore.EExploreColumnType.EDET: {
          out[column.id] = entity.detail || "";
          break;
        }
        // Entity Logical Type
        case Explore.EExploreColumnType.ELT: {
          // only actant classes (person, being, group, object, location, value,
          // event) carry logicalType in their data
          const logicalType = (entity.data as any)?.logicalType;
          const logicalTypeLabel = actantLogicalTypeDict.find(
            (d) => d.value === logicalType
          )?.label;
          out[column.id] = logicalTypeLabel || "";
          break;
        }
        // Entity Class
        case Explore.EExploreColumnType.ECL: {
          out[column.id] =
            entitiesDictKeys[entity.class]?.label || entity.class;
          break;
        }
        // Entity Used In (first-level territories)
        case Explore.EExploreColumnType.EUI: {
          out[column.id] = context.usedInTerritories[entity.id] ?? [];
          break;
        }
      }
    }

    return out;
  }
}
