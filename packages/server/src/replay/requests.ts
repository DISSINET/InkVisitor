/**
 * The fixed request list of the API replay check. Order matters: reads on the
 * pristine seed come first, then writes, then the same reads again so the
 * side effects are recorded. Records the API lets the client name carry fixed
 * ids (rp-*), so only server-generated ids need aliasing (see normalize.ts).
 *
 * Actors come from datasets/default/users.json: admin (id 1), editor1 (id 3,
 * write on t1 via seed.ts), viewer1 (id 5). The signin route is rate limited
 * to 5 attempts per run, so signins are kept to four.
 */
import { SortSpec } from "./normalize";

export type Actor = "anon" | "admin" | "editor" | "viewer";
export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Step {
  name: string;
  as: Actor;
  method: Method;
  path: string;
  body?: unknown;
  /** store the session cookie of this response under this actor */
  saveSessionAs?: Exclude<Actor, "anon">;
  /** response paths (dot notation) replaced by "<stripped>" before recording */
  strip?: string[];
  /** pin the order of unordered lists after normalization (see normalize.ts) */
  sort?: SortSpec[];
  /** response values (dot paths) saved as {{name}} for later paths and bodies */
  capture?: Record<string, string>;
  /** record status and content type only (file downloads) */
  binary?: boolean;
}

type Opts = Partial<Pick<Step, "saveSessionAs" | "strip" | "sort" | "capture" | "binary">>;

const step = (as: Actor, method: Method, name: string, path: string, body?: unknown, opts: Opts = {}): Step =>
  ({ name, as, method, path: `/api${path}`, body, ...opts });
const get = (as: Actor, name: string, path: string, opts?: Opts) => step(as, "GET", name, path, undefined, opts);
const post = (as: Actor, name: string, path: string, body: unknown, opts?: Opts) => step(as, "POST", name, path, body, opts);
const put = (as: Actor, name: string, path: string, body: unknown, opts?: Opts) => step(as, "PUT", name, path, body, opts);
const patch = (as: Actor, name: string, path: string, body: unknown, opts?: Opts) => step(as, "PATCH", name, path, body, opts);
const del = (as: Actor, name: string, path: string, body?: unknown, opts?: Opts) => step(as, "DELETE", name, path, body, opts);

// ---- fixtures -------------------------------------------------------------

const entity = (id: string, cls: string, label: string, data: object, extra: object = {}) => ({
  id,
  class: cls,
  labels: [label],
  detail: "",
  status: "1",
  language: "eng",
  notes: [],
  props: [],
  references: [],
  data,
  ...extra,
});
const logical = { logicalType: "1" };
const bundle = { bundleOperator: "a", bundleStart: false, bundleEnd: false };
const spec = (entityId: string) => ({ entityId, elvl: "1", logic: "1", virtuality: "1", partitivity: "1" });
const prop = (id: string, type: string, value: string) => ({
  id,
  elvl: "1",
  certainty: "1",
  logic: "1",
  mood: [],
  moodvariant: "1",
  ...bundle,
  children: [],
  type: spec(type),
  value: spec(value),
});
const actant = (id: string, entityId: string, position: string) => ({
  id,
  entityId,
  position,
  elvl: "1",
  logic: "1",
  virtuality: "1",
  partitivity: "1",
  ...bundle,
  props: [],
  classifications: [],
  identifications: [],
});
const statement = (id: string, territoryId: string, order: number, text: string, actionId: string, subjectId: string, a1Id: string) =>
  entity(id, "S", "", {
    text,
    territory: { territoryId, order },
    tags: [],
    actions: [{ id: `${id}-act`, actionId, certainty: "1", elvl: "1", logic: "1", mood: [], moodvariant: "1", ...bundle, props: [] }],
    actants: [actant(`${id}-s`, subjectId, "s"), actant(`${id}-a1`, a1Id, "a1")],
  });

const node = (id: string, params: object, edges: object[] = [], operator = "and") =>
  ({ id, type: "Entity", params, operator, edges });
const edge = (id: string, type: string, target: object, logic = "positive") =>
  ({ id, type, params: {}, logic, node: target });
const column = (id: string, type: string, params: object = {}) =>
  ({ id, name: id, type, editable: false, params });
const columns = [
  column("col-scl", "ER", { relationType: "SCL" }),
  column("col-cla-inverse", "ER", { relationType: "CLA", inverse: true }),
  column("col-prop-c3", "EPV", { propertyType: "c3" }),
  column("col-prop-types", "EPT"),
  column("col-ref-resources", "ERR"),
  column("col-ref-values", "ERV", { resource: "dissinet-resource" }),
  column("col-statements", "ES"),
  column("col-created-by", "EUC"),
  column("col-edited-by", "EUE"),
  column("col-edits", "EUEN"),
  column("col-created", "EDC"),
  column("col-status", "EST"),
  column("col-language", "ELA"),
  column("col-alt-labels", "EAL"),
  column("col-pos", "EPOS"),
  column("col-detail", "EDET"),
  column("col-parent-territory", "EPRT"),
  column("col-logical-type", "ELT"),
  column("col-class", "ECL"),
  column("col-used-in", "EUI"),
];
const table = (filters: object[] = [], extra: object = {}) =>
  ({ view: { mode: "table", columns }, filters, limit: 50, offset: 0, ...extra });
// export is plain text, so only columns with a single ordered value can be recorded
const exportColumns = columns.filter((c) =>
  ["EUEN", "EDC", "EST", "ELA", "EAL", "EPOS", "EDET", "EPRT", "ELT", "ECL"].includes(c.type)
);
const FROM = Date.UTC(2019, 0, 1);
const TO = Date.UTC(2031, 0, 1);
const statsView = {
  view: { mode: "stats", stats: { timeUnit: "month", eventType: ["create", "edit"], aggregateBy: "user", fromDate: FROM, toDate: TO } },
  filters: [],
  limit: 50,
  offset: 0,
};
const statsBody = {
  fromDate: FROM,
  toDate: TO,
  timeUnit: "month",
  eventType: ["create", "edit", "delete"],
  aggregateBy: "user",
  filter: {
    userIds: "all",
    editActivities: { entities: true, relationsMeta: true, relationsStatement: true, propsMeta: true, propsStatement: true, references: true, tags: true },
    entityTypes: "all",
    relationTypes: "all",
  },
};
const savedQueryData = (entityId: string) => ({
  query: node("sq-n1", { entityClasses: ["C"] }, [edge("sq-e1", "R:SCL", node("sq-n2", { entityId }))]),
  includeEquivalents: false,
  includeSubordinates: true,
  filters: [{ type: "label", label: "a" }],
});

const health = { strip: ["db.pool", "buildTimestamp"] };

// Order pins for lists the server reads unordered (see normalize.ts).
const byId: Opts = { sort: [{ at: "", by: ["id"] }] };
const plain: Opts = { sort: [{ at: "", by: [] }] };
const aclOrder: Opts = { sort: [{ at: "", by: ["controller", "method", "route"] }] };
const relationOrder: Opts = { sort: [{ at: "", by: ["type", "entityIds", "id"] }] };
const savedQueryOrder: Opts = { sort: [{ at: "data", by: ["name"] }] };
// search results are ordered by label match and label length only; ties keep storage order
const searchOrder: Opts = { sort: [{ at: "", by: ["id"], within: "labels.0.length" }] };
// explore rows are sorted by raw id on the server, which floats for generated ids;
// rowI is that raw position
const exploreOrder: Opts = {
  strip: ["entities.*.rowI"],
  sort: [
    { at: "entities", by: ["entity.id"] },
    { at: "entityIds", by: [] },
    // column values are sets (used-in territories, relation targets, ...) read unordered
    { at: "entities.*.columnData.*", by: [] },
  ],
};
const usedInLists = [
  "usedInStatements", "usedInStatementProps", "usedInMetaProps", "usedInDocuments", "usedAsTemplate",
  "usedInReferences", "usedInReferenceParts", "usedInStatementClassifications", "usedInStatementIdentifications",
  "warnings",
];
const detailOrder: Opts = {
  sort: [
    { at: "relations.*.connections", by: ["type", "entityIds", "id"] },
    { at: "relations.*.iConnections", by: ["type", "entityIds", "id"] },
    { at: "relations.*.connections.*.subtrees", by: [] },
    ...usedInLists.map((at) => ({ at, by: [] })),
  ],
};

// ---- reads on the pristine seed ------------------------------------------

const reads = (suffix: string): Step[] => [
  get("admin", `users-me${suffix}`, "/users/me"),
  get("editor", `users-me-editor${suffix}`, "/users/me"),
  get("admin", `users-list${suffix}`, "/users"),
  get("admin", `users-list-label${suffix}`, "/users?label=edit"),
  get("viewer", `users-simplified${suffix}`, "/users/simplified", byId),
  get("admin", `users-get-editor${suffix}`, "/users/3"),
  get("admin", `users-bookmarks-editor${suffix}`, "/users/3/bookmarks"),
  get("admin", `acls-list${suffix}`, "/acls", aclOrder),
  get("admin", `settings-get-key${suffix}`, "/settings/validation_SValency"),
  get("admin", `settings-get-group-validations${suffix}`, "/settings/group/validations"),
  get("viewer", `settings-get-group-app${suffix}`, "/settings/group/app"),
  get("admin", `documents-list${suffix}`, "/documents"),
  get("editor", `documents-get-1${suffix}`, "/documents/1"),
  get("editor", `saved-queries-list-editor${suffix}`, "/saved-queries", savedQueryOrder),
  get("viewer", `saved-queries-list-viewer${suffix}`, "/saved-queries", savedQueryOrder),
  get("admin", `audits-list${suffix}`, "/audits?from=2019-01-01"),
  get("admin", `audits-list-none${suffix}`, "/audits?from=2035-01-01"),
  get("admin", `entities-get-p1${suffix}`, "/entities/p1"),
  get("viewer", `entities-detail-p1${suffix}`, "/entities/p1/detail", detailOrder),
  get("editor", `entities-detail-c2${suffix}`, "/entities/c2/detail", detailOrder),
  get("admin", `entities-tooltip-p1${suffix}`, "/entities/p1/tooltip", detailOrder),
  get("admin", `entities-relations-p1${suffix}`, "/entities/p1/relations", relationOrder),
  get("admin", `entities-relations-c3-scl-backward${suffix}`, "/entities/c3/relations?filters[relationType]=SCL&forward=false", relationOrder),
  get("admin", `entities-audits-p1${suffix}`, "/entities/p1/audits"),
  get("admin", `statements-get-s1${suffix}`, "/statements/s1"),
  get("editor", `statements-get-s3${suffix}`, "/statements/s3"),
  get("admin", `territories-get-T0${suffix}`, "/territories/T0"),
  get("editor", `territories-get-t1${suffix}`, "/territories/t1?preload=1&warnings=1"),
  get("viewer", `territories-statements-t1${suffix}`, "/territories/t1/statements"),
  get("admin", `territories-entities-t1${suffix}`, "/territories/t1/entities", plain),
  get("admin", `tree-get-admin${suffix}`, "/tree"),
  get("editor", `tree-get-editor${suffix}`, "/tree"),
  get("viewer", `tree-get-viewer${suffix}`, "/tree"),
  get("admin", `relations-list${suffix}`, "/relations", relationOrder),
  get("admin", `relations-list-syn${suffix}`, "/relations?type=SYN", relationOrder),
  // search
  get("admin", `search-label${suffix}`, "/entities?label=Minda", searchOrder),
  get("admin", `search-label-wildcard${suffix}`, "/entities?label=*an*&class=P", searchOrder),
  get("viewer", `search-class-concept${suffix}`, "/entities?class=C", searchOrder),
  get("admin", `search-territory-sub${suffix}`, "/entities?territoryId=T0&subTerritorySearch=true", searchOrder),
  get("admin", `search-territory-statements${suffix}`, "/entities?class=S&territoryId=t1", searchOrder),
  get("admin", `search-cooccurrence${suffix}`, "/entities?cooccurrenceId=p1", searchOrder),
  get("admin", `search-entity-ids${suffix}`, "/entities?entityIds=p1,c2,l1,rp-c"),
  get("admin", `search-entity-ids-array${suffix}`, "/entities?entityIds[]=a1&entityIds[]=b1"),
  get("admin", `search-status-action${suffix}`, "/entities?status=1&class=A", searchOrder),
  get("admin", `search-language${suffix}`, "/entities?language=eng&class=L", searchOrder),
  get("admin", `search-excluded${suffix}`, "/entities?label=*a*&excluded=S,T,C", searchOrder),
  get("admin", `search-equivalents${suffix}`, "/entities?labelOrId=c2&includeEquivalents=true&includeSubordinates=true", searchOrder),
  get("admin", `search-templates${suffix}`, "/entities?onlyTemplates=true", searchOrder),
  get("admin", `search-resource-doc${suffix}`, "/entities?resourceHasDocument=true", searchOrder),
  get("admin", `search-reference-to${suffix}`, "/entities?haveReferenceTo=dissinet-resource", searchOrder),
  get("admin", `search-created-by${suffix}`, "/entities?createdBy=1", searchOrder),
  get("admin", `search-invalid${suffix}`, "/entities?class=nope"),
  get("admin", `search-empty${suffix}`, "/entities"),
  // explore
  post("admin", `explore-concepts${suffix}`, "/entities/query", { query: node("n1", { entityClasses: ["C"] }), explore: table() }, exploreOrder),
  post("admin", `explore-concepts-page2${suffix}`, "/entities/query", { query: node("n1", { entityClasses: ["C"] }), explore: table([], { offset: 50 }) }, exploreOrder),
  post("viewer", `explore-superclass${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["C"] }, [edge("e1", "R:SCL", node("n2", { entityId: "c3" }))]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-superclass-inverse${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["C"] }, [edge("e1", "I_R:SCL", node("n2", { entityId: "c2" }))]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-superclass-negative${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["C"] }, [edge("e1", "R:SCL", node("n2", { entityId: "c3" }), "negative")]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-in-statement${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["S"] }, [edge("e1", "IS:", node("n2", { entityId: "p1" }))]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-inverse-subject${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["P"] }, [edge("e1", "I_IS:S", node("n2", { entityClasses: ["S"] }))]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-inverse-actant1${suffix}`, "/entities/query", {
    query: node("n1", {}, [edge("e1", "I_IS:A1", node("n2", { entityId: "s1" }))]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-statement-under-territory${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["S"] }, [edge("e1", "SUT:", node("n2", { entityId: "t1" }))]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-entity-used-in-territory${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["P", "L"] }, [edge("e1", "EUT:", node("n2", { entityId: "t1" }))]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-has-prop-value${suffix}`, "/entities/query", {
    query: node("n1", {}, [edge("e1", "HP:V", node("n2", { entityId: "l1" }))]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-has-reference-resource${suffix}`, "/entities/query", {
    query: node("n1", {}, [edge("e1", "HR:R", node("n2", { entityId: "dissinet-resource" }))]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-statement-prop-type${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["S"] }, [edge("e1", "SP:T", node("n2", { entityId: "c80" }))]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-or${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["C", "A"] }, [
      edge("e1", "R:SCL", node("n2", { entityId: "c3" })),
      edge("e2", "I_R:HOL", node("n3", { entityId: "c51" })),
      edge("e3", "R:CLA", node("n4", { entityId: "c2" })),
    ], "or"),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-nested${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["C"] }, [
      edge("e1", "R:SOE", node("n2", { entityClasses: ["C"] }, [edge("e2", "R:SCL", node("n3", { entityId: "c3" }))])),
    ]),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-label-param${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["P"], label: "Minda" }),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-equivalents${suffix}`, "/entities/query", {
    query: node("n1", { entityId: "c2", includeEquivalents: true, includeSubordinates: true }),
    explore: table(),
  }, exploreOrder),
  post("admin", `explore-filters${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["C"] }),
    explore: table([{ type: "label", label: "a" }, { type: "status", status: "1" }, { type: "created at", createdAfter: "2019-01-01" }]),
  }, exploreOrder),
  post("admin", `explore-filter-uuids${suffix}`, "/entities/query", {
    query: node("n1", {}),
    explore: table([{ type: "uuids", ids: ["p1", "c1", "rp-c", "missing"] }]),
  }, { sort: [{ at: "entities.*.columnData.*", by: [] }] }),
  post("admin", `explore-sorted${suffix}`, "/entities/query", {
    query: node("n1", { entityClasses: ["L"] }),
    explore: table([], { sort: { columnId: "col-created", direction: "desc" } }),
  }, exploreOrder),
  post("admin", `explore-stats${suffix}`, "/entities/query", { query: node("n1", { entityClasses: ["C", "P"] }), explore: statsView }),
  post("admin", `explore-export${suffix}`, "/entities/query-export", {
    query: node("n1", { entityClasses: ["P"] }),
    explore: { ...table(), view: { mode: "table", columns: exportColumns } },
    rowIndices: [0, 1, 2],
  }),
  // stats
  post("editor", `stats${suffix}`, "/stats", statsBody),
  post("viewer", `stats-materialized${suffix}`, "/stats/materialized", statsBody),
  post("admin", `stats-materialized-by-activity${suffix}`, "/stats/materialized", { ...statsBody, aggregateBy: "activityType" }),
];

// ---- writes ---------------------------------------------------------------

const writes: Step[] = [
  // acl
  post("viewer", "acl-viewer-create-relation-denied", "/relations", { id: "rp-rel-x", type: "SCL", entityIds: ["c1", "c2"] }),
  del("viewer", "acl-viewer-delete-relation-denied", "/relations/rel-1"),
  get("viewer", "acl-viewer-users-list-denied", "/users"),
  put("admin", "acls-put", "/acls/acl-1", { roles: ["admin", "editor"], public: false }),
  put("admin", "acls-put-missing", "/acls/acl-missing", { roles: ["admin"] }),
  get("admin", "acls-list-after-put", "/acls", aclOrder),
  del("admin", "acls-delete", "/acls/acl-2"),
  del("admin", "acls-delete-missing", "/acls/acl-2"),
  // settings
  put("admin", "settings-put-key", "/settings/validation_SValency", { value: false }),
  put("admin", "settings-put-group", "/settings/group/validations", [{ id: "validation_NA", value: false }, { id: "validation_MA", value: false }]),
  put("admin", "settings-put-group-missing", "/settings/group/nope", [{ id: "x", value: 1 }]),
  put("editor", "settings-put-key-denied", "/settings/validation_SValency", { value: true }),
  get("admin", "settings-get-key-after", "/settings/validation_SValency"),
  get("admin", "settings-get-group-after", "/settings/group/validations"),
  // users
  post("admin", "users-create", "/users", {
    id: "u-replay",
    name: "replayuser",
    email: "replay@example.com",
    role: "viewer",
    options: { defaultTerritory: "", defaultLanguage: "eng", searchLanguages: [], workingLanguages: [] },
    bookmarks: [],
    storedTerritories: [],
    rights: [],
    active: true,
    verified: true,
  }),
  post("admin", "users-create-duplicate", "/users", { id: "u-replay-2", name: "replayuser", email: "other@example.com", role: "viewer", options: {}, bookmarks: [], storedTerritories: [], rights: [] }),
  post("admin", "users-create-invalid", "/users", { name: "" }),
  post("editor", "users-create-denied", "/users", { name: "x", email: "x@example.com", role: "viewer" }),
  get("admin", "users-get-created", "/users/u-replay"),
  put("admin", "users-update-editor", "/users/3", { options: { defaultTerritory: "t1", defaultLanguage: "eng", searchLanguages: ["eng"], workingLanguages: ["eng", "lat"] } }),
  put("editor", "users-update-me", "/users/me", {
    bookmarks: [{ id: "bf-1", name: "Replay folder", entityIds: ["p1", "c2", "rp-c"] }],
    storedTerritories: [{ territoryId: "t1" }],
  }),
  put("viewer", "users-update-other-denied", "/users/3", { name: "hacked" }),
  put("admin", "users-update-missing", "/users/u-missing", { name: "x" }),
  get("editor", "users-bookmarks-me", "/users/me/bookmarks"),
  patch("admin", "users-password-reset-editor2", "/users/4/password", {}, { strip: ["message", "data"] }),
  patch("admin", "users-password-reset-missing", "/users/u-missing/password", {}),
  get("admin", "users-get-editor2-after-reset", "/users/4"),
  del("admin", "users-delete-created", "/users/u-replay"),
  del("admin", "users-delete-missing", "/users/u-replay"),
  get("admin", "users-list-after", "/users"),
  // documents
  post("admin", "documents-create", "/documents", {
    id: "doc-replay",
    title: "Replay doc",
    content: "<p1>Minda</p1> went to <l1>Brno</l1> and met <p12>someone</p12> near <l1>Brno</l1>.",
  }),
  post("editor", "documents-create-editor", "/documents", { id: "doc-replay-editor", title: "Editor doc", content: "plain text without anchors" }),
  post("admin", "documents-create-invalid", "/documents", { id: "doc-bad" }),
  get("viewer", "documents-get-created", "/documents/doc-replay"),
  put("admin", "documents-update", "/documents/doc-replay", { title: "Replay doc renamed", content: "<p1>Minda</p1> stayed in <l1>Brno</l1>." }),
  put("viewer", "documents-update-denied", "/documents/doc-replay", { title: "x" }),
  get("admin", "documents-anchors", "/documents/doc-replay/anchors?entityId=p1&index=0"),
  get("admin", "documents-anchors-missing", "/documents/doc-replay/anchors?entityId=zzz&index=0"),
  get("admin", "documents-audits", "/documents/doc-replay/audits"),
  post("admin", "documents-export", "/documents/export", { documentId: "doc-replay", exportedEntities: ["P", "L"] }, { binary: true }),
  post("admin", "documents-export-batch", "/documents/export-batch", { documentIds: ["doc-replay", "1"], exportedEntities: ["P"] }, { binary: true }),
  patch("admin", "documents-remove-anchor", "/documents/doc-replay/removeAnchor", { entityId: "l1", anchorIndex: 0 }),
  patch("admin", "documents-remove-anchors", "/documents/doc-replay/removeAnchors?entityIds=p1", {}),
  get("admin", "documents-get-after-anchor-removal", "/documents/doc-replay"),
  del("admin", "documents-delete-editor-doc", "/documents/doc-replay-editor"),
  del("admin", "documents-delete-missing", "/documents/doc-replay-editor"),
  get("admin", "documents-list-after", "/documents"),
  // saved queries
  post("editor", "saved-queries-create-private", "/saved-queries", { name: "Replay private", shared: false, data: savedQueryData("c3") }, { capture: { sqPrivate: "data.id" } }),
  post("editor", "saved-queries-create-shared", "/saved-queries", { name: "Replay shared", shared: true, data: savedQueryData("c2") }, { capture: { sqShared: "data.id" } }),
  post("editor", "saved-queries-create-duplicate", "/saved-queries", { name: "Replay shared", shared: true, data: savedQueryData("c2") }),
  post("editor", "saved-queries-create-invalid", "/saved-queries", { name: "Broken", shared: false, data: { query: null } }),
  get("viewer", "saved-queries-list-viewer-after-create", "/saved-queries", savedQueryOrder),
  get("editor", "saved-queries-list-editor-after-create", "/saved-queries", savedQueryOrder),
  get("admin", "saved-queries-list-admin-after-create", "/saved-queries", savedQueryOrder),
  put("viewer", "saved-queries-update-denied", "/saved-queries/{{sqPrivate}}", { name: "stolen" }),
  put("editor", "saved-queries-update", "/saved-queries/{{sqPrivate}}", { name: "Replay private renamed", shared: true }),
  put("editor", "saved-queries-update-missing", "/saved-queries/sq-missing", { name: "x" }),
  get("viewer", "saved-queries-list-viewer-after-update", "/saved-queries", savedQueryOrder),
  del("viewer", "saved-queries-delete-denied", "/saved-queries/{{sqShared}}"),
  del("editor", "saved-queries-delete", "/saved-queries/{{sqShared}}"),
  del("admin", "saved-queries-delete-as-admin", "/saved-queries/{{sqPrivate}}"),
  get("editor", "saved-queries-list-editor-after-delete", "/saved-queries", savedQueryOrder),
  // entities create
  post("admin", "entities-create-concept", "/entities", entity("rp-c", "C", "replay concept", { pos: "" })),
  post("admin", "entities-create-action", "/entities", entity("rp-a", "A", "replay action", { valencies: { s: "", a1: "", a2: "" }, entities: { s: [], a1: [], a2: [] }, pos: "verb" })),
  post("admin", "entities-create-person", "/entities", entity("rp-p", "P", "replay person", logical)),
  post("admin", "entities-create-location", "/entities", entity("rp-l", "L", "replay location", logical)),
  post("admin", "entities-create-object", "/entities", entity("rp-o", "O", "replay object", logical)),
  post("admin", "entities-create-group", "/entities", entity("rp-g", "G", "replay group", logical)),
  post("admin", "entities-create-being", "/entities", entity("rp-b", "B", "replay being", logical)),
  post("admin", "entities-create-event", "/entities", entity("rp-e", "E", "replay event", logical)),
  post("admin", "entities-create-value", "/entities", entity("rp-v", "V", "replay value", logical)),
  post("admin", "entities-create-resource", "/entities", entity("rp-r", "R", "replay resource", { url: "https://example.com", partValueLabel: "", partValueBaseURL: "" })),
  post("admin", "entities-create-territory", "/entities", entity("rp-t", "T", "replay territory", { parent: { territoryId: "t1", order: 5 } })),
  post("admin", "entities-create-template", "/entities", entity("rp-tpl", "C", "replay template", { pos: "" }, { isTemplate: true })),
  post("admin", "entities-create-from-template", "/entities", entity("rp-c2", "C", "replay from template", { pos: "" }, { usedTemplate: "rp-tpl" })),
  post("admin", "entities-create-statement", "/entities", statement("rp-s", "t1", 6, "Replay person told a replay concept.", "rp-a", "rp-p", "rp-c")),
  post("editor", "entities-create-concept-editor", "/entities", entity("rp-ce", "C", "editor concept", { pos: "" })),
  post("editor", "entities-create-statement-editor", "/entities", statement("rp-se", "t1", 7, "Editor statement.", "a1", "p1", "c1")),
  post("editor", "entities-create-territory-editor-denied", "/entities", entity("rp-te", "T", "editor territory", { parent: { territoryId: "T0", order: 1 } })),
  post("viewer", "entities-create-denied", "/entities", entity("rp-cv", "C", "viewer concept", { pos: "" })),
  post("admin", "entities-create-invalid", "/entities", { id: "rp-bad", class: "Z" }),
  post("admin", "entities-create-duplicate", "/entities", entity("rp-c", "C", "duplicate id", { pos: "" })),
  // entities update
  put("admin", "entities-update", "/entities/rp-c", { labels: ["replay concept renamed", "alt label"], detail: "updated detail", notes: ["note"] }),
  put("editor", "entities-update-editor", "/entities/rp-p", { detail: "editor touched this" }),
  put("editor", "entities-update-statement-editor", "/entities/rp-se", { data: { text: "Editor statement, edited." } }),
  put("viewer", "entities-update-denied", "/entities/rp-c", { detail: "viewer" }),
  put("admin", "entities-update-missing", "/entities/rp-missing", { detail: "x" }),
  put("admin", "entities-update-invalid", "/entities/rp-c", { class: "Z" }),
  get("admin", "entities-get-updated", "/entities/rp-c"),
  get("admin", "entities-detail-updated", "/entities/rp-c/detail", detailOrder),
  get("admin", "statements-get-created", "/statements/rp-s"),
  get("admin", "entities-audits-updated", "/entities/rp-c/audits"),
  // relations
  post("admin", "relations-create", "/relations", { id: "rp-rel-1", type: "SCL", entityIds: ["rp-c", "c3"], order: 1 }),
  post("editor", "relations-create-synonym", "/relations", { id: "rp-rel-2", type: "SYN", entityIds: ["rp-c", "c1", "c2"] }),
  post("admin", "relations-create-identification", "/relations", { id: "rp-rel-3", type: "IDE", entityIds: ["rp-p", "p1"], certainty: "1" }),
  post("admin", "relations-create-invalid", "/relations", { id: "rp-rel-bad", type: "SCL", entityIds: ["rp-c", "rp-c"] }),
  post("admin", "relations-create-missing-entity", "/relations", { id: "rp-rel-bad2", type: "SCL", entityIds: ["rp-c", "nope"] }),
  put("admin", "relations-update", "/relations/rp-rel-1", { order: 2 }),
  put("admin", "relations-update-missing", "/relations/rp-rel-missing", { order: 2 }),
  get("admin", "entities-relations-created", "/entities/rp-c/relations", relationOrder),
  get("admin", "relations-list-syn-after", "/relations?type=SYN", relationOrder),
  del("editor", "relations-delete", "/relations/rp-rel-2"),
  del("editor", "relations-delete-missing", "/relations/rp-rel-2"),
  // batch operations
  post("admin", "entities-batch-add-metaprop", "/entities/batchAddMetaprop", {
    entityIds: ["rp-c", "rp-p", "missing"],
    propData: { logic: "1", certainty: "1", mood: [], moodvariant: "1", type: spec("c3"), value: spec("l1") },
  }),
  post("admin", "entities-batch-add-reference", "/entities/batchAddReference", { entityIds: ["rp-c", "rp-p"], resourceEntityId: "dissinet-resource", valueEntityId: "rp-v" }),
  post("admin", "entities-batch-add-reference-label", "/entities/batchAddReference", { entityIds: ["rp-l"], resourceEntityId: "dissinet-resource", valueLabel: "page 12" }),
  post("admin", "entities-batch-add-relation", "/entities/batchAddRelation", { entityIds: ["rp-c", "rp-p"], relationType: "CLA", targetEntityId: "c3" }),
  post("admin", "entities-batch-add-relation-invalid-type", "/entities/batchAddRelation", { entityIds: ["rp-c"], relationType: "SYN", targetEntityId: "c3" }),
  post("editor", "entities-batch-add-relation-editor", "/entities/batchAddRelation", { entityIds: ["rp-ce"], relationType: "SCL", targetEntityId: "c2" }),
  post("admin", "entities-batch-get", "/entities/batch", { ids: ["p1", "rp-c", "rp-l", "missing"] }, byId),
  post("admin", "entities-batch-get-invalid", "/entities/batch", {}),
  get("admin", "entities-get-after-batch", "/entities/rp-c"),
  get("admin", "entities-get-location-after-batch", "/entities/rp-l"),
  // statements
  put("admin", "statements-references", "/statements/references?ids=rp-s&replace=1", [{ id: "rp-ref-1", resource: "dissinet-resource", value: "rp-v" }]),
  put("editor", "statements-references-append", "/statements/references?ids=rp-se", [{ id: "rp-ref-2", resource: "dissinet-resource", value: "rp-v" }]),
  put("admin", "statements-references-invalid", "/statements/references?ids=rp-s", [{ id: "" }]),
  post("admin", "statements-batch-copy", "/statements/batch-copy?ids=s1,s2", { territoryId: "rp-t" }),
  post("viewer", "statements-batch-copy-denied", "/statements/batch-copy?ids=s1", { territoryId: "rp-t" }),
  put("admin", "statements-batch-move", "/statements/batch-move?ids=rp-s", { territoryId: "rp-t" }),
  put("admin", "statements-batch-move-missing-territory", "/statements/batch-move?ids=rp-s", { territoryId: "nope" }),
  put("admin", "statements-batch-reorder", "/statements/batch-reorder", { updates: [{ id: "s1", order: 5 }, { id: "s2", order: 0 }, { id: "rp-se", order: 1 }] }),
  put("admin", "statements-batch-reorder-invalid", "/statements/batch-reorder", { updates: [{ id: "s1" }] }),
  get("admin", "territories-statements-t1-after", "/territories/t1/statements"),
  get("admin", "territories-statements-rp-t", "/territories/rp-t/statements"),
  get("admin", "statements-get-moved", "/statements/rp-s"),
  // territories and tree
  post("admin", "territories-copy", "/territories/rp-t/copy", { withChildren: true, targets: ["t1"] }),
  post("admin", "territories-copy-root-denied", "/territories/T0/copy", { targets: ["t1"] }),
  post("admin", "territories-copy-missing-target", "/territories/rp-t/copy", { targets: ["nope"] }),
  patch("admin", "tree-move", "/tree/rp-t/position", { parentId: "T0", newIndex: 0 }),
  patch("admin", "tree-move-missing", "/tree/nope/position", { parentId: "T0", newIndex: 0 }),
  patch("viewer", "tree-move-denied", "/tree/rp-t/position", { parentId: "t1", newIndex: 0 }),
  get("admin", "tree-get-after-move", "/tree"),
  get("admin", "territories-get-rp-t", "/territories/rp-t?preload=1&warnings=1"),
  // clone, delete, restore
  post("admin", "entities-clone", "/entities/rp-b/clone", {}),
  post("admin", "entities-clone-missing", "/entities/rp-missing/clone", {}),
  get("admin", "search-beings-after-clone", "/entities?class=B", searchOrder),
  del("admin", "entities-delete-event", "/entities/rp-e"),
  get("admin", "entities-get-deleted", "/entities/rp-e"),
  post("admin", "entities-restore-event", "/entities/rp-e/restore", {}),
  post("admin", "entities-restore-missing", "/entities/rp-missing/restore", {}),
  get("admin", "entities-get-restored", "/entities/rp-e"),
  del("admin", "entities-delete-batch", "/entities", { entityIds: ["rp-o", "rp-g", "rp-missing"] }),
  del("admin", "entities-delete-used-denied", "/entities/p1"),
  del("viewer", "entities-delete-denied", "/entities/rp-l"),
  del("editor", "entities-delete-editor", "/entities/rp-ce"),
  del("admin", "entities-delete-none", "/entities", {}),
  get("admin", "search-concepts-after-delete", "/entities?class=C&label=replay*", searchOrder),
  // stats after writes
  post("admin", "stats-aggregate", "/stats/aggregate", { fromDate: FROM, toDate: TO, timeUnits: ["month"] }),
  post("admin", "stats-aggregate-invalid", "/stats/aggregate", { fromDate: TO, toDate: FROM }),
  get("admin", "health-after-writes", "/health", health),
];

// ---- signout --------------------------------------------------------------

const signout: Step[] = [
  post("viewer", "signout-viewer", "/users/signout", {}),
  get("viewer", "users-me-after-signout", "/users/me"),
  post("anon", "signout-anon", "/users/signout", {}),
];

export const steps: Step[] = [
  get("anon", "health", "/health", health),
  get("anon", "users-me-anon", "/users/me"),
  get("anon", "users-owner", "/users/owner"),
  post("anon", "signin-bad-password", "/users/signin", { login: "admin", password: "nope" }),
  post("anon", "signin-admin", "/users/signin", { login: "admin", password: "admin" }, { saveSessionAs: "admin" }),
  post("anon", "signin-editor", "/users/signin", { login: "editor1", password: "abc" }, { saveSessionAs: "editor" }),
  post("anon", "signin-viewer", "/users/signin", { login: "viewer1", password: "viewer" }, { saveSessionAs: "viewer" }),
  ...reads(""),
  ...writes,
  ...reads("-after"),
  ...signout,
];
