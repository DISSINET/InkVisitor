import { r, RDatum, RTable, RValue } from "rethinkdb-ts";
import { DbEnums } from "@shared/enums"

const entitiesIndexes: ((table: RTable) => any)[] = [
  // if the prop object is missing value/type/children attrs, this wont work! model should handle this
  (table: RTable) =>
    table.indexCreate(
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
  (table: RTable) =>
    table.indexCreate(
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
              )
          });
        }).add(
          row("data")("actants").concatMap((action: RDatum) => {
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
                )
            });
          }) as any
        ) as any).distinct()
      },
      { multi: true }
    ),
  (table: RTable) => table.indexCreate(DbEnums.Indexes.Class),
  (table: RTable) =>
    table.indexCreate(
      DbEnums.Indexes.StatementTerritory,
      r.row("data")("territory")("territoryId")
    ),
  (table: RTable) =>
    table.indexCreate(
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
            r.branch(row("data").hasFields("territory"), [row("data")("territory")("territoryId")], [])
          ) as any).distinct();
      },
      {
        multi: true,
      }
    ),
  (table: RTable) => table.indexCreate(DbEnums.Indexes.EntityUsedTemplate),
  (table: RTable) =>
    table.indexCreate(
      DbEnums.Indexes.StatementActantsCI,
      function (row: RDatum) {
        return row("data")("actants").concatMap(function (a: RDatum) {
          return r.branch(a.hasFields("classifications"), a("classifications").map(function (cRow: RDatum) {
            return cRow("entityId");
          }), []).add(
            r.branch(a.hasFields("identifications"), a("identifications").map(function (iRow: RDatum) {
              return iRow("entityId");
            }), []) as any
          )
        }).distinct();
      },
      {
        multi: true,
      }
    ),
];

const auditsIndexes: ((table: RTable) => any)[] = [
  (table: RTable) => table.indexCreate(DbEnums.Indexes.AuditEntityId),
];

const relationsIndexes: ((table: RTable) => any)[] = [
  (table: RTable) => table.indexCreate(DbEnums.Indexes.RelationsEntityIds, { multi: true }),
];

export { entitiesIndexes, auditsIndexes, relationsIndexes };
