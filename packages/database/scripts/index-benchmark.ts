const { performance } = require("perf_hooks");
import {
  IEntity,
} from "../../shared/types";
import {
  EntityEnums,
  DbEnums,
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
    .getAll(EntityEnums.Class.Territory, { index: DbEnums.Indexes.Class })
    .run(conn);
  let end = performance.now();
  console.log(
    `testClass(${indexedTable}) took ${end - start} milliseconds. Found ${(items as any).length
    } items.`
  );

  start = performance.now();
  items = await r
    .table(indexedTable)
    .filter({
      class: EntityEnums.Class.Territory,
    })
    .run(conn);
  end = performance.now();
  console.log(
    `testClass(${indexedTable}) took ${end - start} milliseconds. Found ${(items as any).length
    } items.`
  );
};

const testActantsActant = async () => {
  let start = performance.now();

  const example = await r
    .table(indexedTable)
    .filter({ class: EntityEnums.Class.Statement })
    .run(conn);

  const exampleActantsActant = (example as any)[0].data.actants[0].entityId;

  const foundInIndex = await r
    .table(indexedTable)
    .getAll(exampleActantsActant, { index: "data.actants.entityId" })
    .run(conn);

  let end = performance.now();
  console.log(
    `Indexed took ${end - start} milliseconds. Found ${foundInIndex ? (foundInIndex as any[]).length : 0
    } items`
  );

  start = performance.now();

  const foundInNotIndex = await r
    .table(indexedTable)
    .filter(function (user: any) {
      return user("data")("actants").contains((labelObj: any) =>
        labelObj("entityId").eq(exampleActantsActant)
      );
    })
    .run(conn);

  end = performance.now();
  console.log(
    `Unindexed took ${end - start} milliseconds. Found ${foundInNotIndex ? (foundInNotIndex as any[]).length : 0
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
          entry("value")("entityId").eq(entityId),
          entry("type")("entityId").eq(entityId),
          entry("children").contains((ch1: RDatum) =>
            r.or(
              ch1("value")("entityId").eq(entityId),
              ch1("type")("entityId").eq(entityId),
              ch1("children").contains((ch2: RDatum) =>
                r.or(
                  ch2("value")("entityId").eq(entityId),
                  ch2("type")("entityId").eq(entityId),
                  ch2("children").contains((ch3: RDatum) =>
                    r.or(
                      ch3("value")("entityId").eq(entityId),
                      ch3("type")("entityId").eq(entityId)
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
    .filter({ class: EntityEnums.Class.Statement })
    .run(conn);

  const exampleObject = (example as any).find(
    (e: any) => !!e.props.length && !!e.props[0].children.length
  );

  const exampleId = exampleObject.props[0].children[0].type.entityId;
  console.log(exampleId);

  let start = performance.now();

  const foundInIndex = await r
    .table(indexedTable)
    .getAll(exampleId, { index: "props.recursive" })
    .run(conn);

  let end = performance.now();
  console.log(
    `Indexed took ${end - start} milliseconds. Found ${foundInIndex ? (foundInIndex as any[]).length : 0
    } items`
  );

  start = performance.now();

  const foundInNotIndex = await findUsedInProps(conn, exampleId);

  end = performance.now();
  console.log(
    `Unindexed took ${end - start} milliseconds. Found ${foundInNotIndex ? (foundInNotIndex as any[]).length : 0
    } items`
  );
};

const testParentId = async () => {
  let start = performance.now();

  await r
    .table(indexedTable)
    .getAll("parent5005", { index: "data.parent.territoryId" })
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
        territory("data")("parent")("territoryId").eq("parent5005")
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
    `testActantOrActionStatement(${indexedTable}) took ${end - start
    } milliseconds.`
  );

  start = performance.now();

  await r
    .table(indexedTable)
    .filter(function (row: RDatum) {
      const tests = [];
      tests.push(
        row("data")("actants").contains((actantObj: RDatum) =>
          actantObj("entityId").eq("actant4")
        )
      );
      tests.push(
        row("data")("actions").contains((actionObj: RDatum) =>
          actionObj("actionId").eq("action4")
        )
      );

      return r.and(tests[0], tests[1]);
    })
    .run(conn);

  end = performance.now();
  console.log(
    `testActantOrActionStatement(${indexedTable}) took ${end - start
    } milliseconds.`
  );
};

const testPrimaryKey = async () => {
  let start = performance.now();

  const id = "A0192";

  let found = await r.table(indexedTable).get(id).run(conn);

  let end = performance.now();
  console.log(
    `testPrimaryKey(${indexedTable}) took ${end - start} milliseconds. Found ${found ? 1 : 0
    } items.`
  );

  start = performance.now();

  found = await r.table(indexedTable).filter({ id }).run(conn);

  end = performance.now();
  console.log(
    `testPrimaryKey(${indexedTable}) took ${end - start} milliseconds. Found ${(found as any).length
    } items.`
  );
};

const testTerritoryId = async () => {
  const example = await r
    .table(indexedTable)
    .filter({ class: EntityEnums.Class.Statement })
    .run(conn);

  const exampleObject = (example as any).find(
    (e: any) => !!e.data.territory.territoryId
  );

  const exampleId = exampleObject.data.territory.territoryId;

  let start = performance.now();

  let found = await r
    .table(indexedTable)
    .getAll(exampleId, { index: DbEnums.Indexes.StatementTerritory })
    .run(conn);

  let end = performance.now();
  console.log(
    `testTerritoryId(${indexedTable}) took ${end - start} milliseconds. Found ${(found as any).length
    } items.`
  );

  (found as any).forEach((element: any) => console.log(element.class));

  start = performance.now();

  found = await r
    .table(indexedTable)
    .filter((entry: RDatum) => {
      return entry("data")("territory")("territoryId").eq(exampleId);
    })
    .run(conn);

  end = performance.now();
  console.log(
    `testTerritoryId(${indexedTable}) took ${end - start} milliseconds. Found ${(found as any).length
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
          entry("actionId").eq(entityId)
        ),
        row("data")("actants").contains((entry: RDatum) =>
          entry("entityId").eq(entityId)
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
    .filter({ class: EntityEnums.Class.Statement })
    .run(conn);

  const exampleObject = (example as any).find(
    (e: any) => e.data.actants.length > 0
  );

  const exampleId = exampleObject.data.actants[0].entityId;

  let start = performance.now();

  let found = await r
    .table(indexedTable)
    .getAll(exampleId, { index: DbEnums.Indexes.StatementEntities })
    .run(conn);

  let end = performance.now();
  console.log(
    `testStatementEntities(${indexedTable}) took ${end - start
    } milliseconds. Found ${(found as any).length} items.`
  );

  start = performance.now();

  const foundInNotIndex = await findUsedInDataEntities(conn, exampleId);

  end = performance.now();
  console.log(
    `testStatementEntities(${indexedTable}) took ${end - start
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
