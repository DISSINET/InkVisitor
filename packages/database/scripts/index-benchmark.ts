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
  DbIndex,
} from "../../shared/enums";
const fs = require("fs");
import { Connection, r, RDatum, WriteResult } from "rethinkdb-ts";

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
    .getAll(EntityClass.Territory, { index: DbIndex.Class })
    .run(conn);
  let end = performance.now();
  console.log(
    `testClass(${indexedTable}) took ${end - start} milliseconds. Found ${
      (items as any).length
    } items.`
  );

  start = performance.now();
  items = await r
    .table(indexedTable)
    .filter({
      class: EntityClass.Territory,
    })
    .run(conn);
  end = performance.now();
  console.log(
    `testClass(${indexedTable}) took ${end - start} milliseconds. Found ${
      (items as any).length
    } items.`
  );
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

const findUsedInProps = async (
  db: Connection,
  entityId: string
): Promise<IEntity[]> => {
  const entries = await r
    .table(indexedTable)
    .filter((row: RDatum) => {
      return row("props").contains((entry: RDatum) =>
        r.or(
          entry("value")("id").eq(entityId),
          entry("type")("id").eq(entityId),
          entry("children").contains((ch1: RDatum) =>
            r.or(
              ch1("value")("id").eq(entityId),
              ch1("type")("id").eq(entityId),
              ch1("children").contains((ch2: RDatum) =>
                r.or(
                  ch2("value")("id").eq(entityId),
                  ch2("type")("id").eq(entityId),
                  ch2("children").contains((ch3: RDatum) =>
                    r.or(
                      ch3("value")("id").eq(entityId),
                      ch3("type")("id").eq(entityId)
                    )
                  )
                )
              )
            )
          )
        )
      );
    })
    .run(db);

  return entries;
};

const testPropsRecursive = async () => {
  const example = await r
    .table(indexedTable)
    .filter({ class: EntityClass.Statement })
    .run(conn);

  const exampleObject = (example as any).find(
    (e: any) => !!e.props.length && !!e.props[0].children.length
  );

  const exampleId = exampleObject.props[0].children[0].type.id;
  console.log(exampleId);

  let start = performance.now();

  const foundInIndex = await r
    .table(indexedTable)
    .getAll(exampleId, { index: "props.recursive" })
    .run(conn);

  let end = performance.now();
  console.log(
    `Indexed took ${end - start} milliseconds. Found ${
      foundInIndex ? (foundInIndex as any[]).length : 0
    } items`
  );

  start = performance.now();

  const foundInNotIndex = await findUsedInProps(conn, exampleId);

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
    .table(indexedTable)
    .filter(function (territory: any) {
      return r.and(
        territory("data")("parent").typeOf().eq("OBJECT"),
        territory("data")("parent")("id").eq("parent5005")
      );
    })
    .run(conn);

  end = performance.now();
  console.log(
    `testParentId(${indexedTable}) took ${end - start} milliseconds.`
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
    .table(indexedTable)
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
    `testActantOrActionStatement(${indexedTable}) took ${
      end - start
    } milliseconds.`
  );
};

const testPrimaryKey = async () => {
  let start = performance.now();

  const id = "A0192";

  let found = await r.table(indexedTable).get(id).run(conn);

  let end = performance.now();
  console.log(
    `testPrimaryKey(${indexedTable}) took ${end - start} milliseconds. Found ${
      found ? 1 : 0
    } items.`
  );

  start = performance.now();

  found = await r.table(indexedTable).filter({ id }).run(conn);

  end = performance.now();
  console.log(
    `testPrimaryKey(${indexedTable}) took ${end - start} milliseconds. Found ${
      (found as any).length
    } items.`
  );
};

const testTerritoryId = async () => {
  const example = await r
    .table(indexedTable)
    .filter({ class: EntityClass.Statement })
    .run(conn);

  const exampleObject = (example as any).find(
    (e: any) => !!e.data.territory.id
  );

  const exampleId = exampleObject.data.territory.id;

  let start = performance.now();

  let found = await r
    .table(indexedTable)
    .getAll(exampleId, { index: DbIndex.StatementTerritory })
    .run(conn);

  let end = performance.now();
  console.log(
    `testTerritoryId(${indexedTable}) took ${end - start} milliseconds. Found ${
      (found as any).length
    } items.`
  );

  (found as any).forEach((element: any) => console.log(element.class));

  start = performance.now();

  found = await r
    .table(indexedTable)
    .filter((entry: RDatum) => {
      return entry("data")("territory")("id").eq(exampleId);
    })
    .run(conn);

  end = performance.now();
  console.log(
    `testTerritoryId(${indexedTable}) took ${end - start} milliseconds. Found ${
      (found as any).length
    } items.`
  );
};

const findUsedInDataEntities = async (
  db: Connection,
  entityId: string
): Promise<any[]> => {
  const statements = await r
    .table(indexedTable)
    .filter((row: RDatum) => {
      return r.or(
        row("data")("actions").contains((entry: RDatum) =>
          entry("action").eq(entityId)
        ),
        row("data")("actants").contains((entry: RDatum) =>
          entry("actant").eq(entityId)
        ),
        row("data")("tags").contains(entityId)
      );
    })
    .run(db);

  return statements;
};

const testStatementEntities = async () => {
  const example = await r
    .table(indexedTable)
    .filter({ class: EntityClass.Statement })
    .run(conn);

  const exampleObject = (example as any).find(
    (e: any) => e.data.actants.length > 0
  );

  const exampleId = exampleObject.data.actants[0].actant;

  let start = performance.now();

  let found = await r
    .table(indexedTable)
    .getAll(exampleId, { index: DbIndex.StatementEntities })
    .run(conn);

  let end = performance.now();
  console.log(
    `testStatementEntities(${indexedTable}) took ${
      end - start
    } milliseconds. Found ${(found as any).length} items.`
  );

  start = performance.now();

  const foundInNotIndex = await findUsedInDataEntities(conn, exampleId);

  end = performance.now();
  console.log(
    `testStatementEntities(${indexedTable}) took ${
      end - start
    } milliseconds. Found ${(foundInNotIndex as any).length} items.`
  );
};

(async () => {
  conn = await r.connect(config);
  // set default database
  conn.use(config.db);

  // await testPrimaryKey();
  //await testClass();
  //await testTerritoryId();
  await testStatementEntities();
  //await testPropsRecursive();
  //await testActantsActant();
  //await testActantOrActionStatement();
  //await testParentId();
  await conn.close();
})();
