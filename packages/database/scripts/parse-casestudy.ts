/**
 * This node script takes id of one Territory, a case study name, and source of data and prepares a dataset specifically taking the given T structure, usually for a purpose of a case study
 */

import { Connection, r as rethink, RDatum, WriteResult } from "rethinkdb-ts";
import * as fs from "fs";
import { Db } from "@service/rethink";
import { getEnv } from "./import/common";
import { connect } from "http2";
import dotevn from "dotenv";
import { IEntity, IStatement } from "@shared/types";
import { EntityEnums } from "@shared/enums";
import Entity from "@models/entity/entity";
import { getEntityClass } from "@models/factory";

import treeCache from "@service/treeCache";
import Relation from "@models/relation/relation";

// take CLI parameters name, territory and source
const args = process.argv.slice(2);

const usecase = args[0];
const territoryId = args[1];
const source = args[2];

const env = args[3];

const envFile = `env/.env${env ? "." + env : ""}`;
const envData = dotevn.config({ path: envFile }).parsed;

const connectToDb = async () => {
  console.log("Connecting to production DB...");

  try {
    const conn = await rethink.connect({
      host: envData?.["DB_HOST"],
      port: parseInt(envData?.["DB_PORT"] ?? "28015"),
      name: envData?.["DB_NAME"],
      password: envData?.["DB_PASS"],
    });

    return conn;
  } catch (e) {
    console.log("Problem connecting to DB");
    return undefined;
  }
};

const getEntityBuffer = async (eId: string, conn: Connection) => {
  const entityData = await rethink.table("entities").get(eId).run(conn);
  const entityModel = await getEntityClass({ ...entityData });

  const entity = await new Entity(entityModel);

  const buffferEntities = await entity.getEntitiesIds();

  return buffferEntities;
};

const getSEntities = async (sId: string, conn: Connection) => {
  const entitiesIds: Record<string, string | null> = {};
  const statement: IStatement = await rethink
    .table("entities")
    .get(sId)
    .run(conn);

  statement.data.actions?.forEach((a) => {
    entitiesIds[a.actionId] = null;
    if (a.props) {
      Entity.extractIdsFromProps(a.props).forEach((element) => {
        entitiesIds[element] = null;
      });
    }
  });

  statement.data.actants.forEach((a) => {
    entitiesIds[a.entityId] = null;
    a.classifications?.forEach((ca) => (entitiesIds[ca.entityId] = null));
    a.identifications?.forEach((ci) => (entitiesIds[ci.entityId] = null));

    Entity.extractIdsFromProps(a.props).forEach((element) => {
      entitiesIds[element] = null;
    });
  });

  // append territory lineage to the root T
  const parentT = statement.data.territory?.territoryId;
  if (parentT) {
    const treeCacheInstance = treeCache.tree.idMap[parentT];
    const lineageTIds = [
      parentT,
      ...(treeCacheInstance ? treeCacheInstance.path : []),
    ];
    if (lineageTIds) {
      lineageTIds.forEach((tid) => {
        entitiesIds[tid] = null;
      });
    }
  }

  statement.data.tags.forEach((t) => (entitiesIds[t] = null));
  return Object.keys(entitiesIds).filter((id) => !!id);
};

const getTStatements = async (
  TIds: string[],
  conn: Connection
): Promise<string[]> => {
  const statements = await rethink
    .table("entities")
    .filter({
      class: EntityEnums.Class.Statement,
    })
    // .hasFields("data")("territoryId")
    .filter((statement: RDatum<IEntity>) => {
      return rethink
        .expr(TIds)
        .contains(statement("data")("territory")("territoryId"));
    })
    .getField("id")
    .run(conn);

  return statements;
};

const getTlineage = async (
  mainT: string,
  conn: Connection
): Promise<string[]> => {
  const ts: string[] = [mainT];

  const getChildrenT = async (tid: string) => {
    const childrenTs = await rethink
      .table("entities")
      .filter({
        class: EntityEnums.Class.Territory,
      })
      .filter((territory: RDatum<IEntity>) => {
        return rethink.and(
          territory("data")("parent").typeOf().eq("OBJECT"),
          territory("data")("parent")("territoryId").eq(tid)
        );
      })
      .getField("id")
      .run(conn);

    for (const chi in childrenTs) {
      const childT = childrenTs[chi];
      ts.push(childT);
      await getChildrenT(childT);
    }
  };

  await getChildrenT(mainT);

  return ts;
};

const parseUseCase = async () => {
  if (!usecase || !territoryId || !source) {
    console.error(
      "Please provide all the parameters: usecase, territory, source"
    );
    process.exit(1);
  }

  // load the data
  if (source === "production") {
    // connect to production database
    const conn = await connectToDb();
    if (!conn) {
      process.exit(1);
    }
    conn.use("inkvisitor");

    const mainT = await rethink.table("entities").get(territoryId).run(conn);

    const allAs = await rethink
      .table("entities")
      .filter({
        class: EntityEnums.Class.Action,
      })
      .getField("id")
      .run(conn);
    console.log(`Found ${allAs.length} Actions`);

    const allCs = await rethink
      .table("entities")
      .filter({
        class: EntityEnums.Class.Concept,
      })
      .getField("id")
      .run(conn);
    console.log(`Found ${allCs.length} Concepts`);

    const allTs = ["T0", ...(await getTlineage(territoryId, conn))];
    console.log(`Found ${allTs.length} Territories`);

    const allSs = await getTStatements(allTs, conn);
    console.log(`Found ${allSs.length} Statements`);

    const sEntities = [];
    for (var si in allSs) {
      const sId = allSs[si];
      sEntities.push(...(await getSEntities(sId, conn)));
    }
    console.log(`Found ${sEntities.length} Entities in Statements`);

    const isolatedIds = [
      ...new Set([...allAs, ...allCs, ...allTs, ...allSs, ...sEntities]),
    ];
    console.log("All unique entities to buffer:", isolatedIds.length);

    const buffered = [];
    for (var ii in isolatedIds) {
      const entityId = isolatedIds[ii];
      const buffer = await getEntityBuffer(entityId, conn);
      buffered.push(...buffer);
      if ((ii as unknown as number) % 100 === 0) {
        console.log(
          `Buffered ${ii} / ${isolatedIds.length} (${(
            ((ii as unknown as number) / isolatedIds.length) *
            100
          ).toPrecision(2)}%)`
        );
      }
    }
    console.log(`Found ${buffered.length} Entities in buffer`);

    const idsToTake = [...new Set([...isolatedIds, ...buffered])];

    console.log(`Total ${idsToTake.length} unique Entities to process`);

    // get all the entities
    const entities = await rethink
      .table("entities")
      .getAll(...idsToTake)
      .run(conn);

    const fixedEntities = entities.map((entity) => {
      const newE = { ...entity };
      if (newE.statementOrder) {
        delete newE.statementOrder;
      }
      newE.props.forEach((prop: any) => {
        if (prop.statementOrder) {
          delete prop.statementOrder;
          if (prop.children) {
            prop.children.forEach((child: any) => {
              if (child.statementOrder) {
                delete child.statementOrder;
                if (child.children) {
                  child.children.forEach((c: any) => {
                    if (c.statementOrder) {
                      delete c.statementOrder;
                    }
                  });
                }
              }
            });
          }
        }
      });
      newE.actants?.forEach((actant: any) => {
        if (actant.statementOrder) {
          delete actant.statementOrder;
        }
      });
      newE.actions?.forEach((action: any) => {
        if (action.statementOrder) {
          delete action.statementOrder;
        }
      });
      return newE;
    });

    const relations = await rethink
      .table("relations")
      .filter((relation: RDatum<Relation>) => {
        return relation("newEIds").setIntersection(idsToTake).count().gt(0);
      })
      .run(conn);

    console.log(`Found ${relations.length} Relations`);

    fs.writeFileSync(
      `./datasets/${usecase}/relations.json`,
      JSON.stringify(relations, null, 2),
      { encoding: "utf8", flag: "w" }
    );
    fs.writeFileSync(
      `./datasets/${usecase}/entities.json`,
      JSON.stringify(fixedEntities, null, 2),
      { encoding: "utf8", flag: "w" }
    );

    const users = [
      {
        id: "1",
        name: "admin",
        email: "admin@admin.com",
        password: "qYZrrj2EtTpH9aL93T",
        active: true,
        verified: true,
        options: {
          defaultTerritory: "",
          defaultLanguage: "",
          searchLanguages: [],
        },
        bookmarks: null,
        role: "admin",
        rights: [
          {
            territory: "T0",
            mode: "admin",
          },
        ],
      },
      {
        id: "2",
        name: "guest",
        email: "guest@guest.com",
        password: "abc123",
        active: true,
        verified: true,
        options: {
          defaultTerritory: "",
          defaultLanguage: "",
          searchLanguages: [],
        },
        bookmarks: null,
        role: "viewer",
        rights: [
          {
            territory: territoryId,
            mode: "read",
          },
        ],
      },
    ];

    fs.writeFileSync(
      `./datasets/${usecase}/users.json`,
      JSON.stringify(users, null, 2),
      { encoding: "utf8", flag: "w" }
    );

    process.exit(0);
  }
};

parseUseCase();
