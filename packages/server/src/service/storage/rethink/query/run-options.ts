/**
 * Run options for the queries that handle the id sets of a search: an edge's
 * candidate ids, the sets the nodes combine and the ids a search is narrowed
 * to. They are materialised as arrays, which RethinkDB caps at 100,000
 * elements by default, and an unconstrained target on a large database
 * collects more than that.
 */
export const QUERY_RUN_OPTIONS = { arrayLimit: 1_000_000 };
