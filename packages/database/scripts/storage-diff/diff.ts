import { r, Connection } from "rethinkdb-ts";
import { Client } from "pg";
import colors from "colors/safe";
import { TABLES as RETHINK_TABLES } from "@service/storage/rethink/provision";
import { COLUMNS, pgIndexName, TABLES as PG_TABLES } from "@service/storage/postgres/provision";
import { firstDifference, normalize } from "./deep-diff";
import { compareKeys, normalizeKeys, pgKeys, rethinkKeys } from "./index-keys";
import { mergeById, pgRows, rethinkRows } from "./sources";

/** how many ids of each kind a report keeps as examples */
const EXAMPLES = 10;

export interface IndexReport {
  name: string;
  differing: number;
  examples: { id: string; rethink: unknown; postgres: unknown }[];
  /**
   * Rows indexed by PostgreSQL alone because the ReQL key function raised on
   * the document, while the PostgreSQL jsonpath runs in lax mode and indexes
   * whatever it can read. The extra key only adds a lookup result no route
   * asks for, so it is reported and does not fail. A ReQL function that ran
   * and produced no keys counts as differing, not lenient.
   */
  lenient: number;
  lenientExamples: { id: string; postgres: unknown }[];
}

export interface TableReport {
  table: string;
  /** -1 when the table is missing on that side */
  rethink: number;
  postgres: number;
  missingInPg: number;
  extraInPg: number;
  differing: number;
  examples: { missing: string[]; extra: string[]; differing: { id: string; path: string }[] };
  indexes: IndexReport[];
}

/** a table absent in RethinkDB counts as empty, so an empty PostgreSQL table matches it */
const rowsMatch = (t: TableReport): boolean =>
  t.rethink === t.postgres || (t.rethink === -1 && t.postgres === 0);

export function hasDifferences(reports: TableReport[]): boolean {
  return reports.some(
    (t) =>
      !rowsMatch(t) ||
      t.missingInPg > 0 ||
      t.extraInPg > 0 ||
      t.differing > 0 ||
      t.indexes.some((i) => i.differing > 0)
  );
}

/** total of the rows only PostgreSQL indexes, over every index of every table */
export function lenientCount(reports: TableReport[]): number {
  return reports.reduce(
    (sum, t) => sum + t.indexes.reduce((n, i) => n + i.lenient, 0),
    0
  );
}

/** the seeder creates PG databases with code-point ordering; keyset pagination relies on it */
async function assertBytewiseOrdering(client: Client): Promise<void> {
  const { rows } = await client.query("SELECT 'B' < 'b' AS bytewise");
  if (!rows[0].bytewise) {
    throw new Error(
      "the PostgreSQL database does not order strings by code point; create it with the seeder (LOCALE_PROVIDER builtin, C.UTF-8)"
    );
  }
}

/**
 * An index comparison reads its keys through the catalogue's SQL expression,
 * which answers the same whether or not the index exists, so a missing index
 * would diff clean.
 */
async function assertIndexesExist(client: Client): Promise<void> {
  const { rows } = await client.query(
    "SELECT indexname FROM pg_indexes WHERE schemaname = 'public'"
  );
  const present = new Set(rows.map((row: { indexname: string }) => row.indexname));
  const missing = Object.entries(PG_TABLES).flatMap(([table, indexes]) =>
    indexes
      .map((index) => pgIndexName(table, index.name))
      .filter((name) => !present.has(name))
  );
  if (missing.length) {
    throw new Error(
      `the PostgreSQL database is missing ${missing.length} catalogue index(es): ${missing.join(
        ", "
      )}; create it with the seeder`
    );
  }
}

async function diffIndexes(
  conn: Connection,
  client: Client,
  table: string
): Promise<IndexReport[]> {
  const reports: IndexReport[] = [];
  for (const rethinkIndex of RETHINK_TABLES[table]) {
    const pgIndex = PG_TABLES[table].find((i) => i.name === rethinkIndex.name)!;
    const report: IndexReport = {
      name: rethinkIndex.name,
      differing: 0,
      examples: [],
      lenient: 0,
      lenientExamples: [],
    };
    // the catalogues agree on which indexes hold a set of keys, so one flag drives both sides
    const multi = rethinkIndex.multi;
    const spec = pgIndex.kind === "btree" && pgIndex.columns.length === 1 ? COLUMNS[table][pgIndex.columns[0]] : undefined;
    const emptyIsNull = typeof spec === "object" && "ref" in spec;
    const note = (id: string, rethink: unknown, postgres: unknown) => {
      report.differing++;
      if (report.examples.length < EXAMPLES) {
        report.examples.push({ id, rethink, postgres });
      }
    };
    const noteLenient = (id: string, postgres: unknown) => {
      report.lenient++;
      if (report.lenientExamples.length < EXAMPLES) {
        report.lenientExamples.push({ id, postgres });
      }
    };
    await mergeById(rethinkKeys(conn, table, rethinkIndex), pgKeys(client, table, pgIndex), {
      both: (a, b) => {
        const { verdict, rethink, postgres } = compareKeys(a.keys, b.keys, multi, emptyIsNull);
        if (verdict === "lenient") {
          noteLenient(a.id, postgres);
        } else if (verdict === "differing") {
          note(a.id, rethink, postgres);
        }
      },
      leftOnly: (a) => note(a.id, normalizeKeys(a.keys, multi), "(row missing)"),
      rightOnly: (b) => note(b.id, "(row missing)", normalizeKeys(b.keys, multi)),
    });
    reports.push(report);
  }
  return reports;
}

async function diffTable(
  conn: Connection,
  client: Client,
  table: string,
  checkIndexes: boolean
): Promise<TableReport> {
  const report: TableReport = {
    table,
    rethink: 0,
    postgres: 0,
    missingInPg: 0,
    extraInPg: 0,
    differing: 0,
    examples: { missing: [], extra: [], differing: [] },
    indexes: [],
  };
  await mergeById(rethinkRows(conn, table), pgRows(client, table), {
    both: (a, b) => {
      report.rethink++;
      report.postgres++;
      const path = firstDifference(normalize(a.doc), normalize(b.doc));
      if (path !== null) {
        report.differing++;
        if (report.examples.differing.length < EXAMPLES) {
          report.examples.differing.push({ id: a.id, path });
        }
      }
    },
    leftOnly: (a) => {
      report.rethink++;
      report.missingInPg++;
      if (report.examples.missing.length < EXAMPLES) {
        report.examples.missing.push(a.id);
      }
    },
    rightOnly: (b) => {
      report.postgres++;
      report.extraInPg++;
      if (report.examples.extra.length < EXAMPLES) {
        report.examples.extra.push(b.id);
      }
    },
  });
  if (checkIndexes) {
    report.indexes = await diffIndexes(conn, client, table);
  }
  return report;
}

/** every table of the catalogue; a table missing in RethinkDB reports -1 rows there */
export async function diffDatabases(
  conn: Connection,
  client: Client,
  opts: { indexes: boolean }
): Promise<TableReport[]> {
  await assertBytewiseOrdering(client);
  await assertIndexesExist(client);
  const rethinkTables = (await r.tableList().run(conn)) as string[];
  const reports: TableReport[] = [];
  for (const table of Object.keys(PG_TABLES)) {
    if (!rethinkTables.includes(table)) {
      const { rows } = await client.query(`SELECT count(*)::int AS n FROM "${table}"`);
      reports.push({
        table,
        rethink: -1,
        postgres: rows[0].n,
        missingInPg: 0,
        extraInPg: 0,
        differing: 0,
        examples: { missing: [], extra: [], differing: [] },
        indexes: [],
      });
      continue;
    }
    reports.push(await diffTable(conn, client, table, opts.indexes));
  }
  return reports;
}

export function printReports(reports: TableReport[]): void {
  for (const t of reports) {
    const clean = !hasDifferences([t]);
    const rethinkCount = t.rethink === -1 ? "absent" : `${t.rethink} rows`;
    const head = `${clean ? colors.green("ok  ") : colors.red("DIFF")} ${t.table}: rethinkdb ${rethinkCount}, postgres ${t.postgres} rows`;
    console.log(head);
    if (t.missingInPg) {
      console.log(`      missing in postgres: ${t.missingInPg} (e.g. ${t.examples.missing.join(", ")})`);
    }
    if (t.extraInPg) {
      console.log(`      extra in postgres: ${t.extraInPg} (e.g. ${t.examples.extra.join(", ")})`);
    }
    if (t.differing) {
      console.log(`      differing documents: ${t.differing}`);
      for (const d of t.examples.differing) {
        console.log(`        ${d.id} at ${d.path}`);
      }
    }
    for (const i of t.indexes) {
      if (i.differing) {
        console.log(`      index ${i.name}: ${i.differing} rows with different keys`);
        for (const e of i.examples) {
          console.log(`        ${e.id}: rethinkdb ${JSON.stringify(e.rethink)} postgres ${JSON.stringify(e.postgres)}`);
        }
      }
      if (i.lenient) {
        console.log(
          `      index ${i.name}: ${i.lenient} rows indexed only in postgres (the rethinkdb key function raised on them)`
        );
        for (const e of i.lenientExamples) {
          console.log(`        ${e.id}: postgres ${JSON.stringify(e.postgres)}`);
        }
      }
    }
  }
}
