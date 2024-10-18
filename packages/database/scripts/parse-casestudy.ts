/**
 * This node script takes id of one Territory, a case study name, and source of data and prepares a dataset specifically taking the given T structure, usually for a purpose of a case study
 */

import Entity from "@models/entity/entity";
import { getEntityClass } from "@models/factory";
import { EntityEnums } from "@shared/enums";
import { IEntity, IProp, IStatement, Relation } from "@shared/types";
import dotevn from "dotenv";
import * as fs from "fs";
import { Connection, RDatum, r as rethink } from "rethinkdb-ts";

import treeCache from "@service/treeCache";

// take CLI parameters name, territory and source
const args = process.argv.slice(2);

const usecase = args[0];
const territoryId = args[1];
const source = args[2];

const env = args[3];

const envFile = `env/.env${env ? "." + env : ""}`;
const envData = dotevn.config({ path: envFile }).parsed;

const entitiesAll: Record<string, IEntity> = {};
const relationsAll: Record<string, Relation.IRelation> = {};
const entityRelationsMap: Record<string, Relation.IRelation[]> = {};

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

const processProp = (prop: IProp): [string[], boolean] => {
  const typeId = prop.type.entityId;
  const valueId = prop.value.entityId;

  const typeE = entitiesAll[typeId];
  const valueE = entitiesAll[valueId];

  if (!typeE || !valueE) {
    return [[], false];
  } else if (
    typeE.class === EntityEnums.Class.Territory ||
    valueE.class === EntityEnums.Class.Territory
  ) {
    return [[], false];
  } else {
    return [[typeId, valueId], false];
  }
};

const getPropEntities = (props: IProp[] | undefined): string[] => {
  if (!props) {
    return [];
  }
  const eids: string[] = [];

  props.forEach((p1) => {
    const [es, isOk] = processProp(p1);
    eids.push(...es);
    if (isOk) {
      p1.children?.forEach((p2) => {
        const [es2, isOk2] = processProp(p2);
        eids.push(...es2);
        if (isOk2) {
          p2.children?.forEach((p3) => {
            const [es3, isOk3] = processProp(p3);
            eids.push(...es3);
          });
        }
      });
    }
  });
  return [...new Set(eids)];
};

const getDetailEntities = (eId: string): string[] => {
  const entity: IEntity = entitiesAll[eId];
  if (!entity) {
    console.log(`Entity ${eId} not found`);
    return [];
  }

  const detailIds: string[] = [];
  detailIds.push(...getPropEntities(entity.props));

  entity.references?.forEach((r) => {
    detailIds.push(r.resource);
    detailIds.push(r.value);
  });

  const relations: Relation.IRelation[] = entityRelationsMap[eId] || [];

  relations.forEach((r) => {
    detailIds.push(...r.entityIds);
  });

  const eSet = new Set(detailIds);
  // remove itself
  eSet.delete(eId);
  return [...eSet];
};

const getSEntities = async (
  sId: string,
  conn: Connection
): Promise<string[]> => {
  const entitiesIds: string[] = [];
  const statement: IStatement = entitiesAll[sId] as IStatement;

  if (!statement) {
    return [];
  }

  statement.data.actions?.forEach((a) => {
    entitiesIds.push(a.actionId);
    entitiesIds.push(...getPropEntities(a.props));
  });

  statement.data.actants.forEach((a) => {
    entitiesIds.push(a.entityId);
    a.classifications?.forEach((ca) => entitiesIds.push(ca.entityId));
    a.identifications?.forEach((ci) => entitiesIds.push(ci.entityId));

    entitiesIds.push(...getPropEntities(a.props));
  });

  entitiesIds.push(...statement.data.tags);
  return [...new Set(entitiesIds)];
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

    const entityList: IEntity[] = await rethink.table("entities").run(conn);
    entityList.forEach((e: IEntity) => {
      entitiesAll[e.id as string] = e;
    });
    console.log("Entities loaded");

    const relationsList: Relation.IRelation[] = await rethink
      .table("relations")
      .run(conn);

    relationsList.forEach((r: Relation.IRelation) => {
      relationsAll[r.id as string] = r;
    });

    // entityRelationsMap
    Object.values(relationsAll).forEach((r) => {
      r.entityIds.forEach((eid) => {
        if (!entityRelationsMap[eid]) {
          entityRelationsMap[eid] = [];
        }
        entityRelationsMap[eid].push(r);
      });
    });

    console.log("Relations loaded");

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

    const caseIds = [
      ...new Set([...sEntities, ...allSs, ...allTs, territoryId]),
    ];
    console.log("All unique entities to buffer:", caseIds.length);

    const processed: Record<string, boolean> = {};
    const buffered: string[] = [];

    let processedCount = 0;
    const processEntity = (eId: string) => {
      // console.log("processing ", eId);
      if (processed[eId]) {
        return;
      }

      const detailIds = getDetailEntities(eId);
      buffered.push(...detailIds);

      if (processedCount % 1000 === 0) {
        console.log(`Mined ${buffered.length} entities`);
      }
      processed[eId] = true;

      for (var di in detailIds) {
        processEntity(detailIds[di]);
      }

      processedCount++;
    };

    for (var ci in caseIds) {
      processEntity(caseIds[ci]);
      // console.log(
      //   `Processed ${parseInt(ci) + 1} Entities [${
      //     ((parseInt(ci) + 1) / caseIds.length) * 100
      //   }%]`
      // );
    }

    console.log(`Found ${buffered.length} Entities in buffer`);

    const idsToTake = [...new Set([...caseIds, ...buffered])];

    console.log(`Total ${idsToTake.length} unique Entities to process`);

    // get all the entities
    const entities = idsToTake.map((id) => entitiesAll[id]);

    const relations = await rethink
      .table("relations")
      .filter((relation: RDatum<Relation.IRelation>) => {
        return relation("entityIds").setIntersection(idsToTake).count().gt(0);
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
      JSON.stringify(entities, null, 2),
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
