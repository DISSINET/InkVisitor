import { RelationEnums } from "@shared/enums";
import { Relation } from "@shared/types";
import { RValue, RTable } from "rethinkdb-ts";


export interface DbSchema {
  users: TableSchema;
  aclPermissions: TableSchema;
  entities: TableSchema;
  audits: TableSchema;
  relations: TableSchema;
  documents: TableSchema;
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

const [datasetId, env] = parseArgs();
const envFile = `env/.env${env ? "." + env : ''}`;
const envData = require("dotenv").config({ path: envFile }).parsed;

if (!envData) {
  throw new Error(`Cannot load env file ${envFile}`);
}

export function getEnv(envName: string): string {
  if (envData[envName] !== undefined) {
    return envData[envName] as string;
  }

  throw new Error(`ENV variable '${envName}' is required`);
}

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
