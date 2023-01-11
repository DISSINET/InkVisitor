import { RelationEnums } from "@shared/enums";
import { Relation } from "@shared/types";
import {
  Connection,
  RConnectionOptions,
  r,
  RValue,
  RTable,
} from "rethinkdb-ts";

export interface DbSchema {
  users: TableSchema;
  aclPermissions: TableSchema;
  entities: TableSchema;
  audits: TableSchema;
  relations: TableSchema;
}

export interface TableSchema {
  tableName: RValue<string>;
  data: any;
  transform: () => void;
  indexes?: ((table: RTable) => any)[];
}

export function parseArgs(): [datasetId: string, env: string] {
  const datasetId: string = process.argv[2];
  const env = process.argv[3];

  return [datasetId, env];
}

export const prepareDbConnection = async (
  config: RConnectionOptions
): Promise<Connection> => {
  let conn: Connection;

  try {
    conn = await r.connect(config);
  } catch (e) {
    throw new Error(`Cannot connect to the db: ${e}`);
  }

  // Drop the database.
  try {
    await r.dbDrop(config.db as RValue<string>).run(conn);
    console.log("Database dropped");
  } catch (e) {
    console.log(`Database not dropped ('${config.db}'). Does not exist?`);
  }

  try {
    await r.dbCreate(config.db as RValue<string>).run(conn);
    console.log("Database created");
  } catch (e) {
    throw new Error(`Database not created: ${e}`);
  }

  // set default database
  conn.use(config.db as string);

  return conn;
};

export const checkRelation = (
  relation: Relation.IRelation,
  entityIds: string[]
): boolean => {
  // right number of entities
  // TODO: check by rele models
  if (
    relation.entityIds.length !== 2 &&
    relation.type !== RelationEnums.Type.Synonym
  ) {
    console.log(
      ` -- relation removed: wrong number of entities ${relation.entityIds}`
    );
    return false;
  } else {
    // entity ids should not be the same
    if (
      relation.entityIds.length === 2 &&
      relation.entityIds[0] === relation.entityIds[1]
    ) {
      console.log(
        ` -- relation removed: entities are the same ${relation.entityIds}`
      );
      return false;
    }
  }

  // check if entity is empty or not string
  if (
    !relation.entityIds.every(
      (eid: any) => eid && typeof eid === "string" && eid.length !== 0
    )
  ) {
    console.log(
      ` -- relation removed: invalid entity id ${relation.entityIds}`
    );
    return false;
  }

  // check if entity is not in entity list
  if (!relation.entityIds.every((eid: any) => entityIds.includes(eid))) {
    console.log(` -- relation removed: entity not found ${relation.entityIds}`);
    return false;
  }

  return true;
};
