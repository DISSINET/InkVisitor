import {
  IAudit,
  IDocument,
  IDocumentMeta,
  IEntity,
  IResponsePermission,
  ISavedQuery,
  IUser,
  Relation as RelationTypes,
  RequestSearch,
} from "@inkvisitor/shared/types";
import { EntityEnums, HttpMethods, RelationEnums } from "@inkvisitor/shared/enums";
import { ISetting } from "@inkvisitor/shared/types/settings";
import { Query } from "@inkvisitor/shared/types/query";
import { AuditScope } from "@inkvisitor/shared/types";
import { EventType, TimeUnit } from "@inkvisitor/shared/types/stats";

/**
 * Storage adapter boundary (#3258). Models, modules and services only ever see
 * these types; the database driver lives behind `./rethink`. Every operation
 * here is named after what a call site does, not after a query construct, so a
 * second backend implements the same surface without exposing its own idioms.
 */

export type Row = Record<string, any>;

/** An open database connection. Opaque outside the adapter. */
export type Conn = { readonly __storageConn: "conn" };

/** Outcome of a write, in the shape every call site already reads. */
export interface WriteResult {
  deleted: number;
  errors: number;
  inserted: number;
  replaced: number;
  skipped: number;
  unchanged: number;
  generated_keys?: string[];
  first_error?: string;
  changes?: { new_val?: Row | null; old_val?: Row | null }[];
}

export type ConflictMode = "error" | "replace" | "update";

export interface TableStore<T extends Row = Row> {
  get(conn: Conn, id: string): Promise<T | null>;
  /** rows for the given ids, in storage order; missing ids are skipped */
  getMany(conn: Conn, ids: string[]): Promise<T[]>;
  all(conn: Conn): Promise<T[]>;
  /** rows whose secondary index `index` holds any of `keys` */
  byIndex(conn: Conn, index: string, keys: unknown[]): Promise<T[]>;
  insert(conn: Conn, rows: Row | Row[], opts?: { conflict?: ConflictMode }): Promise<WriteResult>;
  update(conn: Conn, id: string, patch: Row): Promise<WriteResult>;
  replace(conn: Conn, id: string, row: Row): Promise<WriteResult>;
  delete(conn: Conn, id: string): Promise<WriteResult>;
  deleteMany(conn: Conn, ids: string[], opts?: { returnChanges?: boolean }): Promise<WriteResult>;
  /** wipes the table; the guard that keeps this off real data lives in the caller */
  deleteAll(conn: Conn): Promise<WriteResult>;
}

/** The request fields the entity search applies in the database. Everything
 * else on RequestSearch (dates, users, territory, co-occurrence) is resolved
 * into `entityIds` by the model before the search runs. */
export type SearchFilters = Pick<
  RequestSearch,
  | "class"
  | "status"
  | "usedTemplate"
  | "language"
  | "onlyTemplates"
  | "resourceHasDocument"
  | "excluded"
  | "label"
  | "labelOrId"
  | "entityIds"
  | "haveReferenceTo"
>;

export interface EntityStore extends TableStore<IEntity> {
  byClass(conn: Conn, entityClass: EntityEnums.Class): Promise<IEntity[]>;
  /** statements whose secondary index `index` holds `key` */
  statementsByIndex(conn: Conn, index: string, key: string): Promise<IEntity[]>;
  resourcesByDocumentId(conn: Conn, documentId: string): Promise<IEntity[]>;
  resourcesByDocumentIds(conn: Conn, documentIds: string[]): Promise<IEntity[]>;
  territoryChildren(conn: Conn, parentId: string): Promise<IEntity[]>;
  /** (entityId, territoryId) pairs for every statement referencing one of
   * `entityIds` through any of `indexes`; territoryId is null for a statement
   * with a malformed territory */
  statementTerritoryPairs(
    conn: Conn,
    entityIds: string[],
    indexes: string[]
  ): Promise<{ entityId: string; territoryId: string | null }[]>;
  updateStatementTerritoryOrders(
    conn: Conn,
    updates: { id: string; territoryId: string; order: number }[],
    updatedAt: Date
  ): Promise<void>;
  /** subset of `ids` whose labels match the prepared label pattern */
  idsMatchingLabel(
    conn: Conn,
    ids: string[],
    label: string,
    leftWildcard: string,
    rightWildcard: string
  ): Promise<string[]>;
  labelsOf(conn: Conn, ids: string[]): Promise<{ id: string; labels?: string[] }[]>;
  /** entity search; `seedIds` restricts the scan to those rows before any filter */
  search(conn: Conn, filters: SearchFilters, opts?: { seedIds?: string[] }): Promise<IEntity[]>;
}

export interface RelationStore extends TableStore<RelationTypes.IRelation> {
  byType(conn: Conn, type?: RelationEnums.Type): Promise<RelationTypes.IRelation[]>;
  /** relations touching any of `entityIds`, each once, optionally of one type */
  forEntities(
    conn: Conn,
    entityIds: string[],
    type?: RelationEnums.Type
  ): Promise<RelationTypes.IRelation[]>;
}

export interface AuditCountParams {
  from?: Date;
  to?: Date;
  eventTypes: string[];
  timeUnit: TimeUnit;
  /** audit fields grouped after the time bucket, in this order */
  groupBy: string[];
  /** entity-scoped audits only, for these entities */
  entityIds?: string[];
}

export interface AuditStore extends TableStore<IAudit> {
  firstFor(conn: Conn, scope: AuditScope, modelId: string): Promise<IAudit | null>;
  lastFor(conn: Conn, scope: AuditScope, modelId: string): Promise<IAudit | null>;
  lastNFor(conn: Conn, scope: AuditScope, modelId: string, n: number): Promise<IAudit[]>;
  relationAuditsForEntity(conn: Conn, entityId: string, n: number): Promise<IAudit[]>;
  earliestDate(conn: Conn): Promise<Date | null>;
  /** audits on the calendar day of `date` */
  onDate(conn: Conn, date: Date): Promise<IAudit[]>;
  entityScopedInRange(conn: Conn, after?: Date, before?: Date): Promise<IAudit[]>;
  byTypeAndUser(conn: Conn, type: EventType, user: string): Promise<IAudit[]>;
  page(conn: Conn, filter: { skip: number; take: number; from: Date }): Promise<IAudit[]>;
  /** event counts per time bucket and group key; group[0] is the bucket */
  countByBucket(conn: Conn, params: AuditCountParams): Promise<{ group: string[]; reduction: number }[]>;
}

export interface UserStore extends TableStore<IUser> {
  owner(conn: Conn): Promise<IUser | null>;
  byEmail(conn: Conn, email: string): Promise<IUser | null>;
  byHash(conn: Conn, hash: string): Promise<IUser | null>;
  /** users not soft-deleted, ordered by role then name */
  allActive(conn: Conn): Promise<IUser[]>;
  byLogin(conn: Conn, login: string, includeTrashed: boolean): Promise<IUser | null>;
  byBookmarkedEntity(conn: Conn, entityId: string): Promise<IUser[]>;
  byStoredTerritory(conn: Conn, territoryId: string): Promise<IUser[]>;
  /** test helper: wipes every user but the named one */
  deleteAllExceptName(conn: Conn, name: string): Promise<WriteResult>;
}

export interface DocumentStore extends TableStore<IDocument> {
  byEntityId(conn: Conn, entityId: string): Promise<IDocumentMeta[]>;
  byEntityIds(conn: Conn, entityIds: string[]): Promise<IDocumentMeta[]>;
  allByCreatedAt(conn: Conn): Promise<IDocument[]>;
  /** every document without content and anchors, oldest first */
  listMeta(conn: Conn): Promise<IDocument[]>;
}

export interface AclStore extends TableStore<IResponsePermission> {
  byRoute(conn: Conn, controller: string, method: HttpMethods, route: string): Promise<IResponsePermission[]>;
}

export type SettingStore = TableStore<ISetting>;

export interface SavedQueryStore extends TableStore<ISavedQuery> {
  /** ids of the queries named `normalizedName` in the same folder (shared, or the owner's private) */
  idsWithName(conn: Conn, normalizedName: string, shared: boolean, ownerId: string): Promise<string[]>;
  /** shared queries plus the user's own, newest first */
  visibleFor(conn: Conn, userId: string): Promise<ISavedQuery[]>;
}

export interface MaterializedStatsStore extends TableStore<Row> {
  byDateRange(
    conn: Conn,
    fromDate: string,
    toDate: string,
    eventTypes: string[],
    aggregateBy: string
  ): Promise<Row[]>;
  latestUpdate(conn: Conn): Promise<Date | null>;
}

export interface SessionRow {
  id: string;
  userId?: string;
  data: string;
  expiresAt: number;
}

export interface SessionStore {
  /** creates the sessions table on first use */
  ensure(conn: Conn): Promise<void>;
  get(conn: Conn, sid: string): Promise<SessionRow | null>;
  /** inserts or overwrites */
  set(conn: Conn, row: SessionRow): Promise<void>;
  delete(conn: Conn, sid: string): Promise<void>;
  deleteByUser(conn: Conn, userId: string): Promise<void>;
  /** @returns number of removed rows */
  deleteExpired(conn: Conn, now: number): Promise<number>;
}

export interface ChangeHandlers {
  /** the feed (re)connected and may have missed events */
  onClear(): void;
  onChange(newVal: { id?: string } | null, oldVal: { id?: string } | null): void;
}

/** id expansion the explore evaluator needs for a pinned target node; the
 * relation semantics behind it belong to the models, so they are injected */
export interface ExploreResolvers {
  equivalents(conn: Conn, ids: string[]): Promise<string[]>;
  subordinates(conn: Conn, ids: string[]): Promise<string[]>;
}

/** A compiled explore query tree, evaluated against one connection. */
export interface ExplorePlan {
  type: Query.NodeType;
  params: Query.INodeParams;
  isValid(): boolean;
  /** @returns matching entity ids */
  run(conn: Conn): Promise<string[]>;
}

export interface Storage {
  readonly kind: "rethinkdb";
  /** throws when the connection settings are missing from the environment */
  assertConfigured(): void;
  /** a dedicated connection; `db: null` opens it without selecting a database */
  openConnection(opts?: { db?: string | null; timeoutSeconds?: number }): Promise<Conn>;
  closeConnection(conn: Conn, opts?: { noreplyWait?: boolean }): Promise<void>;
  isOpen(conn: Conn): boolean;
  /** cheapest possible round-trip, used to validate pooled connections */
  ping(conn: Conn): Promise<void>;
  tableList(conn: Conn): Promise<string[]>;
  /** fails fast when an index a route depends on is missing */
  assertRequiredIndexes(conn: Conn): Promise<void>;
  /** drops `name` if present, then creates it with every table and index */
  createDatabase(name: string): Promise<void>;
  dropDatabase(name: string): Promise<void>;
  /** follows writes to `table` forever, reconnecting with backoff */
  watch(name: string, table: string, handlers: ChangeHandlers): void;

  entities: EntityStore;
  relations: RelationStore;
  audits: AuditStore;
  users: UserStore;
  documents: DocumentStore;
  acl: AclStore;
  settings: SettingStore;
  savedQueries: SavedQueryStore;
  stats(timeUnit: string): MaterializedStatsStore;
  sessions: SessionStore;

  explore: {
    plan(query: Query.INode, resolvers: ExploreResolvers): ExplorePlan;
  };
}
