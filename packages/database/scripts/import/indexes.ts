import { r, RDatum, RTable, RValue } from "rethinkdb-ts";
import { DbEnums } from "@inkvisitor/shared/enums";
import { DbSchema, IndexDef } from "./common";

/**
 * Pairs an index name with its build function. `build` invokes
 * `table.indexCreate(name, ...args)` so the args list mirrors RethinkDB's
 * `indexCreate` signature (datum/function and optional `{ multi: true }`).
 */
const def = (name: string, ...args: unknown[]): IndexDef => ({
  name,
  build: (table: RTable) => (table.indexCreate as any)(name, ...args),
});

const entitiesIndexes: IndexDef[] = [
  // if the prop object is missing value/type/children attrs, this wont work! model should handle this
  def(
    DbEnums.Indexes.PropsRecursive,
    r
      .row("props")
      .concatMap((prop: RDatum) =>
        r
          .expr([prop("value")("entityId"), prop("type")("entityId")])
          .add(
            prop("children").concatMap((ch1: RDatum) =>
              r
                .expr([ch1("value")("entityId"), ch1("type")("entityId")])
                .add(
                  ch1("children").concatMap((ch2: RDatum) =>
                    r
                      .expr([
                        ch2("value")("entityId"),
                        ch2("type")("entityId"),
                      ])
                      .add(
                        ch2("children").concatMap((ch3: RDatum) => [
                          ch3("value")("entityId"),
                          ch3("type")("entityId"),
                        ]) as RValue
                      )
                  ) as RValue
                )
            ) as RValue
          )
      )
      .distinct(),
    { multi: true }
  ),
  def(
    DbEnums.Indexes.StatementDataProps,
    function (row: RDatum) {
      return (row("data")("actions").concatMap((action: RDatum) => {
        return action("props").concatMap((ch1: RDatum) => {
          return r
            .expr([ch1("value")("entityId"), ch1("type")("entityId")])
            .add(
              ch1("children").concatMap((ch2: RDatum) =>
                r
                  .expr([
                    ch2("value")("entityId"),
                    ch2("type")("entityId"),
                  ])
                  .add(
                    ch2("children").concatMap((ch3: RDatum) => [
                      ch3("value")("entityId"),
                      ch3("type")("entityId"),
                    ]) as RValue
                  )
              ) as RValue
            );
        });
      }).add(
        row("data")("actants").concatMap((actant: RDatum) => {
          return actant("props").concatMap((ch1: RDatum) => {
            return r
              .expr([ch1("value")("entityId"), ch1("type")("entityId")])
              .add(
                ch1("children").concatMap((ch2: RDatum) =>
                  r
                    .expr([
                      ch2("value")("entityId"),
                      ch2("type")("entityId"),
                    ])
                    .add(
                      ch2("children").concatMap((ch3: RDatum) => [
                        ch3("value")("entityId"),
                        ch3("type")("entityId"),
                      ]) as RValue
                    )
                ) as RValue
              );
          });
        }) as any
      ) as any).distinct();
    },
    { multi: true }
  ),
  def(DbEnums.Indexes.Class),
  def(
    DbEnums.Indexes.StatementTerritory,
    r.row("data")("territory")("territoryId")
  ),
  def(
    DbEnums.Indexes.StatementEntities,
    function (row: RDatum) {
      return (row("data")("actions")
        .map(function (a: RDatum) {
          return a("actionId");
        })
        .add(
          row("data")("actants").map(function (a: RDatum) {
            return a("entityId");
          }) as any,
          row("data")("tags").map(function (t: RDatum) {
            return t;
          }) as any,
          r.branch(row("data").hasFields("territory"), [row("data")("territory")("territoryId")], []) as any
        ) as any).distinct();
    },
    { multi: true }
  ),
  def(DbEnums.Indexes.EntityUsedTemplate),
  def(
    DbEnums.Indexes.StatementActantsCI,
    function (row: RDatum) {
      return row("data")("actants").concatMap(function (a: RDatum) {
        return r.branch(a.hasFields("classifications"), a("classifications").map(function (cRow: RDatum) {
          return cRow("entityId");
        }), []).add(
          r.branch(a.hasFields("identifications"), a("identifications").map(function (iRow: RDatum) {
            return iRow("entityId");
          }), []) as any
        );
      }).distinct();
    },
    { multi: true }
  ),
];

const auditsIndexes: IndexDef[] = [
  def(DbEnums.Indexes.AuditScopeModelId, [
    r.row("auditScope"),
    r.row("modelId"),
  ]),
  def(DbEnums.Indexes.AuditDate),
  def(DbEnums.Indexes.AuditDateTypeUser, [
    r.row("date"),
    r.row("type"),
    r.row("user"),
  ]),
];

const relationsIndexes: IndexDef[] = [
  def(DbEnums.Indexes.RelationsEntityIds, { multi: true }),
];

// Materialized stats indexes for each time unit
const materializedStatsIndexes: IndexDef[] = [
  def("date"),
  def("lastUpdated"),
  def("date_eventType_aggregateBy", [
    r.row("date"),
    r.row("eventType"),
    r.row("aggregateBy"),
  ]),
];

export const DbSchemaIndexes: { [key in keyof DbSchema]: IndexDef[] } = {
  entities: entitiesIndexes,
  audits: auditsIndexes,
  relations: relationsIndexes,
  documents: [],
  settings: [],
  users: [],
  aclPermissions: [],
  statsMaterializedDay: materializedStatsIndexes,
  statsMaterializedMonth: materializedStatsIndexes,
  statsMaterializedWeek: materializedStatsIndexes,
  statsMaterializedYear: materializedStatsIndexes,
};
