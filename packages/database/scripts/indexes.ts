import { DbIndex } from "@shared/enums";
import { r, RDatum, RTable, RValue } from "rethinkdb-ts";

const entitiesIndexes: ((table: RTable) => any)[] = [
  // if the prop object is missing value/type/children attrs, this wont work! model should handle this
  (table: RTable) =>
    table.indexCreate(
      "props.recursive",
      r
        .row("props")
        .concatMap((prop: RDatum) =>
          r
            .expr([prop("value")("id"), prop("type")("id")])
            .add(
              prop("children").concatMap((ch1: RDatum) =>
                r
                  .expr([ch1("value")("id"), ch1("type")("id")])
                  .add(
                    ch1("children").concatMap((ch2: RDatum) =>
                      r
                        .expr([ch2("value")("id"), ch2("type")("id")])
                        .add(
                          ch2("children").concatMap((ch3: RDatum) => [
                            ch3("value")("id"),
                            ch3("type")("id"),
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
  (table: RTable) => table.indexCreate(DbIndex.Class),
  (table: RTable) =>
    table.indexCreate(
      DbIndex.StatementTerritory,
      r.row("data")("territory")("id")
    ),
  (table: RTable) =>
    table.indexCreate(
      DbIndex.StatementEntities,
      function (row: RDatum) {
        return row("data")("actions")
          .map(function (a: RDatum) {
            return a("action");
          })
          .add(
            row("data")("actants").map(function (a: RDatum) {
              return a("actant");
            }) as any,
            row("data")("tags").map(function (t: RDatum) {
              return t;
            }) as any
          );
      },
      {
        multi: true,
      }
    ),
  (table: RTable) => table.indexCreate(DbIndex.EntityUsedTemplate),
];

const auditsIndexes: ((table: RTable) => any)[] = [
  (table: RTable) => table.indexCreate(DbIndex.AuditEntityId),
];

export { entitiesIndexes, auditsIndexes };
