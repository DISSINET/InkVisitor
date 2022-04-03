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

  const example = await r
    .table(indexedTable)
    .filter({ class: EntityClass.Statement })
    .run(conn);

  const exampleActantsActant = (example as any)[0].data.actants[0].actant;

  const foundInIndex = await r
    .table(indexedTable)
    .getAll(exampleActantsActant, { index: "data.actants.actant" })
    .run(conn);

  let end = performance.now();
  console.log(
    `Indexed took ${end - start} milliseconds. Found ${
      foundInIndex ? (foundInIndex as any[]).length : 0
    } items`
  );

  start = performance.now();

  const foundInNotIndex = await r
    .table(indexedTable)
    .filter(function (user: any) {
      return user("data")("actants").contains((labelObj: any) =>
        labelObj("actant").eq(exampleActantsActant)
      );
    })
    .run(conn);

  end = performance.now();
  console.log(
    `Unindexed took ${end - start} milliseconds. Found ${
      foundInNotIndex ? (foundInNotIndex as any[]).length : 0
    } items`
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

  //await testClass();
  await testActantsActant();
  //await testActantOrActionStatement();
  //await testParentId();
  await conn.close();
})();
