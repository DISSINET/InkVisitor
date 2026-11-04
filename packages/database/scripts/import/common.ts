import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation } from "@inkvisitor/shared/types";

export interface DbSchema {
  users: TableSchema;
  aclPermissions: TableSchema;
  entities: TableSchema;
  audits: TableSchema;
  relations: TableSchema;
  documents: TableSchema;
  settings: TableSchema;
  statsMaterializedDay: TableSchema;
  statsMaterializedWeek: TableSchema;
  statsMaterializedMonth: TableSchema;
  statsMaterializedYear: TableSchema;
  savedQueries: TableSchema;
}
export interface TableSchema {
  /** physical table name, the same on every backend */
  tableName: string;
  data?: any;
  dataFilePath?: string;
  transform?: () => void;
}

/** value of a `--name=value` argument */
export function flag(name: string): string | undefined {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

/** whether a bare `--name` argument is present */
export function has(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/** arguments that are not `--flags`; the first one names the env file */
export function positionals(): string[] {
  return process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
}

export function parseArgs(): [datasetId: string, env: string] {
  const [datasetId, env] = positionals();
  return [datasetId, env];
}

const [env] = positionals();
const envFile = `env/.env${env ? "." + env : ""}`;
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

/** an env value that may be absent or empty */
export function getEnvOptional(envName: string): string | undefined {
  const value = envData[envName];
  return value === undefined || value === "" ? undefined : (value as string);
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
