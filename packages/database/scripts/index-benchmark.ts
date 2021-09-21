import { IUser } from "../../shared/types/user";
const { performance } = require("perf_hooks");
import {
  IAction,
  IEntity,
  IResource,
  IStatement,
  ITerritory,
} from "../../shared/types";
import {
  ActantStatus,
  ActantType,
  Elvl,
  Language,
  Logic,
  Operator,
  Partitivity,
  Position,
  Virtuality,
} from "../../shared/enums";
const fs = require("fs");
import { r, RDatum, WriteResult } from "rethinkdb-ts";

const envData = require("dotenv").config({ path: `env/.env.local` }).parsed;

function doIndex(statement: any, connection: any): Promise<any> {
  return new Promise((resolve) => {
    statement.run(connection, resolve);
  });
}

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

const indexedTable = "actants";
const unindexedTable = "actants_raw";

let conn: any;

const config = {
  db: envData.DB_NAME,
  host: envData.DB_HOST,
  port: envData.DB_PORT,
  password: process.env.DB_AUTH,
};

const importData = async () => {
  try {
    // Drop the database.
    try {
      await r.dbDrop(config.db).run(conn);
      console.log("database dropped");
    } catch (e) {
      console.log("database not dropped");
    }

    // Recreate the database
    try {
      await r.dbCreate(config.db).run(conn);
      console.log("database created");
    } catch (e) {
      console.log("database not created");
    }

    for (const tableName of [indexedTable, unindexedTable]) {
      await r.tableCreate(tableName).run(conn);

      if (tableName == indexedTable) {
        await r.table(indexedTable).indexCreate("class").run(conn);
        await r.table(indexedTable).indexCreate("label").run(conn);
        await r
          .table(indexedTable)
          .indexCreate("data.actants.actant", function (actant: any) {
            return actant("data")("actants").map(function (a: any) {
              return a("actant");
            });
          })
          .run(conn);
      }

      for (let i = 0; i < 15000; i++) {
        if (i === 5000) {
          continue;
        }
        const entry: IStatement = {
          class: ActantType.Statement,
          detail: "",
          id: i.toString(),
          label: "",
          language: [Language.English],
          notes: [],
          status: ActantStatus.Pending,
          data: {
            actants: [
              {
                actant: i.toString(),
                bundleEnd: false,
                bundleStart: false,
                elvl: Elvl.Inferential,
                id: i.toString(),
                logic: Logic.Negative,
                operator: Operator.And,
                partitivity: Partitivity.DiscreteParts,
                position: Position.Actant1,
                virtuality: Virtuality.Allegation,
              },
            ],
            actions: [],
            props: [],
            references: [],
            tags: [`tag${i}`],
            territory: {
              id: "ha",
              order: 0,
            },
            text: "text",
          },
        };
        await r.table(tableName).insert(entry).run(conn);
      }

      for (let i = 20000; i < 20500; i++) {
        const entry: IResource = {
          class: ActantType.Resource,
          data: {
            link: "wdew",
          },
          detail: "",
          id: i.toString(),
          label: "",
          language: [Language.English],
          notes: [],
          status: ActantStatus.Pending,
        };
        await r.table(tableName).insert(entry).run(conn);
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    console.log("closing connection");
  }
};

const testClass = async () => {
  let start = performance.now();
  let items = await r
    .table(indexedTable)
    .getAll(ActantType.Resource, { index: "class" })
    .run(conn);
  let end = performance.now();
  console.log(items);
  console.log(`testClass(${indexedTable} took ${end - start} milliseconds.`);

  start = performance.now();
  await r
    .table(unindexedTable)
    .filter({
      class: ActantType.Resource,
    })
    .run(conn);
  end = performance.now();
  console.log(`testClass(${unindexedTable} took ${end - start} milliseconds.`);
};

const testActantsActant = async () => {
  let start = performance.now();

  await r.table(indexedTable).getAll(4999, "data.actants.actant").run(conn);

  let end = performance.now();
  console.log(
    `testActantsActant(${indexedTable} took ${end - start} milliseconds.`
  );

  start = performance.now();

  await r
    .table(unindexedTable)
    .filter(function (user: any) {
      return user("data")("actants").contains((labelObj: any) =>
        labelObj("actant").eq(4999)
      );
    })
    .run(conn);

  end = performance.now();
  console.log(
    `testActantsActant(${unindexedTable} took ${end - start} milliseconds.`
  );
};

(async () => {
  conn = await r.connect(config);
  // set default database
  conn.use(config.db);

  await importData();
  // await testClass();
  await testActantsActant();
  await conn.close();
})();
