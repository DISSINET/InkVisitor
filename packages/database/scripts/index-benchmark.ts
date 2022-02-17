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
  EntityStatus,
  EntityClass,
  Certainty,
  Elvl,
  Language,
  Logic,
  Mood,
  MoodVariant,
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

const indexedTable = "entities";
const unindexedTable = "entities_raw";

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
        await r
          .table(indexedTable)
          .indexCreate("data.parent.id", function (actant: any) {
            return actant("data")("parent")("id");
          })
          .run(conn);
        await r
          .table(indexedTable)
          .indexCreate(
            "actantOrActionStatement",
            function (row: any) {
              return row("data")("actants").map(function (actant: any) {
                return row("data")("actions").map(function (action: any) {
                  return [actant("actant"), action("action")];
                });
              });
            },
            { multi: true }
          )
          .run(conn);
      }

      for (let i = 0; i < 100; i++) {
        const entry: IStatement = {
          class: EntityClass.Statement,
          detail: "",
          id: i.toString(),
          label: "",
          language: Language.Latin,
          notes: [],
          props: [],
          data: {
            actants: [
              {
                actant: "actant" + i.toString(),
                bundleEnd: false,
                bundleStart: false,
                elvl: Elvl.Inferential,
                id: i.toString(),
                logic: Logic.Negative,
                operator: Operator.And,
                partitivity: Partitivity.DiscreteParts,
                position: Position.Actant1,
                virtuality: Virtuality.Allegation,
                props: [],
              },
            ],
            actions: [
              {
                action: "action" + i.toString(),
                bundleEnd: false,
                bundleStart: false,
                certainty: Certainty.AlmostCertain,
                elvl: Elvl.Inferential,
                id: i.toString(),
                logic: Logic.Negative,
                mood: [Mood.Indication],
                moodvariant: MoodVariant.Irrealis,
                operator: Operator.And,
                props: [],
              },
            ],
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

      for (let i = 5000; i < 5100; i++) {
        const entry: ITerritory = {
          class: EntityClass.Territory,
          detail: "",
          id: i.toString(),
          label: "",
          language: Language.Latin,
          notes: [],
          props: [],
          data: {
            parent: {
              id: "parent" + i.toString(),
              order: 0,
            },
          },
        };
        await r.table(tableName).insert(entry).run(conn);

        // parentless
        const entry2: ITerritory = {
          class: EntityClass.Territory,
          detail: "",
          id: i.toString(),
          label: "",
          language: Language.Latin,
          notes: [],
          props: [],
          data: {
            parent: false,
          },
        };
        await r.table(tableName).insert(entry2).run(conn);
      }

      for (let i = 20000; i < 20010; i++) {
        const entry: IResource = {
          class: EntityClass.Resource,
          props: [],
          data: {
            link: "wdew",
          },
          detail: "",
          id: i.toString(),
          label: "",
          language: Language.Latin,
          notes: [],
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
    .getAll(EntityClass.Resource, { index: "class" })
    .run(conn);
  let end = performance.now();
  console.log(`testClass(${indexedTable}) took ${end - start} milliseconds.`);

  start = performance.now();
  await r
    .table(unindexedTable)
    .filter({
      class: EntityClass.Resource,
    })
    .run(conn);
  end = performance.now();
  console.log(`testClass(${unindexedTable}) took ${end - start} milliseconds.`);
};

const testActantsActant = async () => {
  let start = performance.now();

  await r.table(indexedTable).getAll("100", "data.actants.actant").run(conn);

  let end = performance.now();
  console.log(
    `testActantsActant(${indexedTable}) took ${end - start} milliseconds.`
  );

  start = performance.now();

  await r
    .table(unindexedTable)
    .filter(function (user: any) {
      return user("data")("actants").contains((labelObj: any) =>
        labelObj("actant").eq("100")
      );
    })
    .run(conn);

  end = performance.now();
  console.log(
    `testActantsActant(${unindexedTable}) took ${end - start} milliseconds.`
  );
};

const testParentId = async () => {
  let start = performance.now();

  await r
    .table(indexedTable)
    .getAll("parent5005", { index: "data.parent.id" })
    .run(conn);

  let end = performance.now();
  console.log(
    `testParentId(${indexedTable}) took ${end - start} milliseconds.`
  );

  start = performance.now();

  await r
    .table(unindexedTable)
    .filter(function (territory: any) {
      return r.and(
        territory("data")("parent").typeOf().eq("OBJECT"),
        territory("data")("parent")("id").eq("parent5005")
      );
    })
    .run(conn);

  end = performance.now();
  console.log(
    `testParentId(${unindexedTable}) took ${end - start} milliseconds.`
  );
};

const testActantOrActionStatement = async () => {
  let start = performance.now();

  await r
    .table(indexedTable)
    .getAll([["actant1", "action1"]], {
      index: "actantOrActionStatement",
    })
    .run(conn);

  let end = performance.now();
  console.log(
    `testActantOrActionStatement(${indexedTable}) took ${
      end - start
    } milliseconds.`
  );

  start = performance.now();

  await r
    .table(unindexedTable)
    .filter(function (row: RDatum) {
      const tests = [];
      tests.push(
        row("data")("actants").contains((actantObj: RDatum) =>
          actantObj("actant").eq("actant4")
        )
      );
      tests.push(
        row("data")("actions").contains((actionObj: RDatum) =>
          actionObj("action").eq("action4")
        )
      );

      return r.and(tests[0], tests[1]);
    })
    .run(conn);

  end = performance.now();
  console.log(
    `testActantOrActionStatement(${unindexedTable}) took ${
      end - start
    } milliseconds.`
  );
};

(async () => {
  conn = await r.connect(config);
  // set default database
  conn.use(config.db);

  await importData();
  await testClass();
  await testActantsActant();
  await testActantOrActionStatement();
  await testParentId();
  await conn.close();
})();
