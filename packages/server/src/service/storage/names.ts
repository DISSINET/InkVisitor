/** Physical table names, the same on both backends. */
export const TABLE = {
  entities: "entities",
  relations: "relations",
  audits: "audits",
  users: "users",
  acl: "acl_permissions",
  documents: "documents",
  settings: "settings",
  savedQueries: "saved_queries",
  sessions: "sessions",
  statsPrefix: "stats_materialized_",
} as const;
