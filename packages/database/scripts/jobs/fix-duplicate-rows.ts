import { Connection, r } from "rethinkdb-ts";
import { IJob } from ".";
import { confirm } from "../import/prompts";

/**
 * Removes what the PostgreSQL constraints refuse, so a migration from this
 * database adds them on the first try:
 *
 * - a second relation over the same entities (UNIQUE (type, entityIds)); the
 *   copy with the lowest `order` stays, then the smallest id
 * - a second acl_permissions row for one route; the row granting the most
 *   (public, then "*", then the most roles) stays, then the smallest id
 * - a resource whose data.documentId names no document, and an entity whose
 *   usedTemplate names no entity: the reference is blanked, the entity stays
 *
 * A relation naming an entity that no longer exists is listed only: no
 * constraint covers an array column, and restoring the entity may be the
 * better fix. Every row is printed first and written after a confirmation.
 */
interface Relation {
  id: string;
  type: string;
  entityIds: string[];
  order?: number | string;
}

interface Permission {
  id: string;
  controller: string;
  method: string;
  route: string;
  roles?: string[];
  public?: boolean;
}

const groupBy = <T>(rows: T[], key: (row: T) => string): T[][] => {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    groups.set(k, [...(groups.get(k) ?? []), row]);
  }
  return [...groups.values()].filter((group) => group.length > 1);
};

const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : 1);

const relationOrder = (rel: Relation): number => (typeof rel.order === "number" ? rel.order : Infinity);

const permissionRank = (row: Permission): number =>
  (row.public ? 1000 : 0) + ((row.roles ?? []).includes("*") ? 100 : 0) + (row.roles ?? []).length;

const fixDuplicateRowsJob: IJob = async (db: Connection): Promise<void> => {
  const relations: Relation[] = await r.table("relations").run(db);
  const permissions: Permission[] = await r.table("acl_permissions").run(db);
  const entityIds = new Set<string>(await r.table("entities")("id").coerceTo("array").run(db));
  const documentIds = new Set<string>(await r.table("documents")("id").coerceTo("array").run(db));

  const relationDrops = groupBy(relations, (rel) => `${rel.type}|${rel.entityIds.join(",")}`).flatMap((group) => {
    const [keep, ...rest] = [...group].sort((a, b) => relationOrder(a) - relationOrder(b) || byId(a, b));
    console.log(`relation ${keep.type} ${keep.entityIds.join(" -> ")}: keeping ${keep.id}, deleting ${rest.map((rel) => rel.id).join(", ")}`);
    return rest.map((rel) => rel.id);
  });

  const permissionDrops = groupBy(permissions, (row) => `${row.controller}|${row.method}|${row.route}`).flatMap((group) => {
    const [keep, ...rest] = [...group].sort((a, b) => permissionRank(b) - permissionRank(a) || byId(a, b));
    console.log(
      `acl ${keep.controller} ${keep.method} "${keep.route}": keeping ${keep.id} ${JSON.stringify(keep.roles)}${keep.public ? " public" : ""}, ` +
        `deleting ${rest.map((row) => `${row.id} ${JSON.stringify(row.roles)}`).join(", ")}`
    );
    return rest.map((row) => row.id);
  });

  const resources = (await r.table("entities").filter({ class: "R" }).pluck("id", { data: { documentId: true } }).run(db)) as {
    id: string;
    data?: { documentId?: string };
  }[];
  const orphanDocuments = resources
    .map((row) => ({ id: row.id, documentId: row.data?.documentId ?? "" }))
    .filter((row) => row.documentId && !documentIds.has(row.documentId));
  for (const row of orphanDocuments) {
    console.log(`resource ${row.id}: document ${row.documentId} does not exist, blanking data.documentId`);
  }

  const templated = (await r
    .table("entities")
    .hasFields("usedTemplate")
    .filter(r.row("usedTemplate").ne(""))
    .pluck("id", "usedTemplate")
    .run(db)) as { id: string; usedTemplate: string }[];
  const orphanTemplates = templated.filter((row) => !entityIds.has(row.usedTemplate));
  for (const row of orphanTemplates) {
    console.log(`entity ${row.id}: template ${row.usedTemplate} does not exist, blanking usedTemplate`);
  }

  for (const rel of relations) {
    const missing = rel.entityIds.filter((id) => !entityIds.has(id));
    if (missing.length) {
      console.log(`relation ${rel.id} (${rel.type}) names missing entities ${missing.join(", ")}: left as is`);
    }
  }

  const changes = relationDrops.length + permissionDrops.length + orphanDocuments.length + orphanTemplates.length;
  if (!changes) {
    console.log("Nothing to fix");
    return;
  }
  if (!(await confirm(`Apply the ${changes} changes above?`))) {
    console.log("Nothing written");
    return;
  }

  if (relationDrops.length) {
    const result = await r.table("relations").getAll(...relationDrops).delete().run(db);
    console.log(`Deleted ${result.deleted} relations`);
  }
  if (permissionDrops.length) {
    const result = await r.table("acl_permissions").getAll(...permissionDrops).delete().run(db);
    console.log(`Deleted ${result.deleted} acl_permissions rows`);
  }
  for (const row of orphanDocuments) {
    await r.table("entities").get(row.id).update({ data: { documentId: "" } }).run(db);
  }
  for (const row of orphanTemplates) {
    await r.table("entities").get(row.id).update({ usedTemplate: "" }).run(db);
  }
  console.log(`Blanked ${orphanDocuments.length} document and ${orphanTemplates.length} template references`);
};

export default fixDuplicateRowsJob;
