import { IUser } from "@inkvisitor/shared/types/user";
import { hashPassword } from "../../../server/src/common/auth";
import { IAudit, IEntity } from "@inkvisitor/shared/types";
import { Relation } from "@inkvisitor/shared/types/relation";
import { DbSchema, checkRelation, TableSchema } from "./common";
import { EntityEnums } from "@inkvisitor/shared/enums";
import * as fs from "fs";
import * as path from "path";

/**
 * What the seeder can import: the registered datasets below (tables, data
 * files, transforms) and every other directory under datasets/ as a "raw"
 * dataset with one JSON file per table. Nothing here touches a database.
 */

export const DATASETS_DIR = path.join(__dirname, "../../datasets");
/** a JSON file above this size is streamed at import time instead of loaded */
export const MAX_LOAD_JSON_BYTES = 100 * 1024 * 1024;

const defaultSettingsTable: TableSchema = {
  tableName: "settings",
  data: require("../../datasets/default/settings.json"),
};

// Materialized stats tables for each time unit
const materializedStatsTables = {
  statsMaterializedDay: {
    tableName: "stats_materialized_day",
  },
  statsMaterializedWeek: {
    tableName: "stats_materialized_week",
  },
  statsMaterializedMonth: {
    tableName: "stats_materialized_month",
  },
  statsMaterializedYear: {
    tableName: "stats_materialized_year",
  },
};

const savedQueriesTables = {
  savedQueries: {
    tableName: "saved_queries",
  },
};

/**
 * Scans the datasets directory and finds directories that match keys in the datasets object
 * These can be used as 'raw' datasets
 * @returns Array of raw dataset names (directory names that match dataset keys)
 */
export function findRawDatasets(): string[] {
  const datasetsDir = DATASETS_DIR;
  const rawDatasets: string[] = [];

  if (!fs.existsSync(datasetsDir)) {
    return rawDatasets;
  }

  const datasetKeys = Object.keys(datasets);
  const entries = fs.readdirSync(datasetsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirName = entry.name;
      
      if (
        !datasetKeys.includes(dirName)
      ) {
        rawDatasets.push(dirName);
      }
    }
  }

  return rawDatasets;
}

export const datasets: Record<string, DbSchema> = {
  empty: {
    settings: defaultSettingsTable,
    users: {
      tableName: "users",
      data: require("../../datasets/default/users.json"),
      transform: function () {
        this.data = this.data.map((user: IUser) => {
          user.password = hashPassword(user.password ? user.password : "");
          return user;
        });
      },
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: require("../../datasets/default/acl_permissions.json"),
    },
    entities: {
      tableName: "entities",
      data: require("../../datasets/empty/entities.json"),
      transform: function () {
        this.data = this.data.map((entity: IEntity) => {
          if (!entity.createdAt) {
            entity.createdAt = new Date();
          }
          return entity;
        });
      },
    },
    audits: {
      tableName: "audits",
      data: require("../../datasets/empty/audits.json"),
      transform: function () {
        this.data = this.data.map((audit: IAudit) => {
          audit.date = new Date(audit.date);
          return audit;
        });
      },
    },
    relations: {
      tableName: "relations",
      data: require("../../datasets/empty/relations.json"),
    },
    documents: {
      tableName: "documents",
      data: require("../../datasets/default/documents.json"),
    },
    ...materializedStatsTables,
    ...savedQueriesTables,
  },

  relationstest: {
    settings: defaultSettingsTable,
    users: {
      tableName: "users",
      data: require("../../datasets/default/users.json"),
      transform: function () {
        // get a list of all entities
        const entities = require("../../datasets/relationstest/entities.json");
        const allTIds = entities
          .filter((e: any) => e.class === EntityEnums.Class.Territory)
          .map((e: any) => e.id);

        this.data = this.data.map((user: IUser) => {
          user.password = hashPassword(user.password ? user.password : "");
          user.rights = user.rights.filter((r: any) =>
            allTIds.includes(r.territory)
          );
          return user;
        });
      },
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: require("../../datasets/default/acl_permissions.json"),
    },
    entities: {
      tableName: "entities",
      data: require("../../datasets/relationstest/entities.json"),
      transform: function () {
        this.data = this.data.map((entity: IEntity) => {
          if (!entity.createdAt) {
            entity.createdAt = new Date();
          }
          return entity;
        });
      },
    },
    audits: {
      tableName: "audits",
      data: require("../../datasets/empty/audits.json"),
      transform: function () {
        this.data = this.data.map((audit: IAudit) => {
          audit.date = new Date(audit.date);
          return audit;
        });
      },
    },
    relations: {
      tableName: "relations",
      data: require("../../datasets/relationstest/relations.json"),
      transform: function () {
        // check validity
        const entities = require("../../datasets/relationstest/entities.json");
        const allEntityIds = entities.map((e: any) => e.id);
        this.data = this.data.filter((relation: Relation.IRelation) => {
          return checkRelation(relation, allEntityIds);
        });

        this.data = this.data.map((relation: Relation.IRelation) => {
          if (!relation.order) {
            relation.order = 1;
          }
          return relation;
        });
      },
    },
    documents: {
      tableName: "documents",
      data: require("../../datasets/default/documents.json"),
    },
    ...materializedStatsTables,
    ...savedQueriesTables,
  },

  all_parsed: {
    settings: defaultSettingsTable,
    users: {
      tableName: "users",
      data: require("../../datasets/all_parsed/users.json"),
      transform: function () {
        this.data = this.data.map((user: IUser) => {
          user.password = hashPassword(user.password ? user.password : "");
          return user;
        });
      },
    },
    aclPermissions: {
      tableName: "acl_permissions",
      data: require("../../datasets/default/acl_permissions.json"),
    },
    entities: {
      tableName: "entities",
      data: require("../../datasets/all_parsed/entities.json"),
      transform: function () {
        this.data = this.data.map((entity: IEntity) => {
          if (!entity.createdAt) {
            entity.createdAt = new Date();
          }

          // fix missing entity pos
          if (entity.class === EntityEnums.Class.Concept) {
            if (!entity.data.pos) {
              entity.data.pos = EntityEnums.ConceptPartOfSpeech.Empty;
            }
          }
          if (entity.class === EntityEnums.Class.Action) {
            if (!entity.data.pos) {
              entity.data.pos = EntityEnums.ActionPartOfSpeech.Verb;
            }
          }

          return entity;
        });
      },
    },
    audits: {
      tableName: "audits",
      data: require("../../datasets/all_parsed/audits.json"),
      transform: function () {
        this.data = this.data.map((audit: IAudit) => {
          audit.date = new Date(audit.date);
          return audit;
        });
      },
    },
    relations: {
      tableName: "relations",
      data: require("../../datasets/all_parsed/relations.json"),
      transform: function () {
        this.data = this.data.map((relation: Relation.IRelation) => {
          if (!relation.order) {
            relation.order = 1;
          }
          return relation;
        });
      },
    },
    documents: {
      tableName: "documents",
      data: require("../../datasets/default/documents.json"),
    },
    ...materializedStatsTables,
    ...savedQueriesTables,
  },
};

const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

/** a dataset from a directory of `<table>.json` files; large files stay on disk */
export async function prepareRawDataset(datasetName: string): Promise<DbSchema> {
  const dir = path.join(DATASETS_DIR, datasetName);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const datasetTables: DbSchema = {
    settings: { tableName: "settings" },
    users: { tableName: "users" },
    aclPermissions: { tableName: "acl_permissions" },
    entities: { tableName: "entities" },
    audits: { tableName: "audits" },
    relations: { tableName: "relations" },
    documents: { tableName: "documents" },
    ...materializedStatsTables,
    ...savedQueriesTables,
  };

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".json")) {
      const dataFilePath = path.join(dir, entry.name);
      const tableKey = snakeToCamel(entry.name.replace(".json", ""));
      const tableConfig = datasetTables[tableKey as keyof DbSchema];
      if (!tableConfig) {
        continue;
      }
      const stat = fs.statSync(dataFilePath);
      if (stat.size > MAX_LOAD_JSON_BYTES) {
        tableConfig.dataFilePath = dataFilePath;
      } else {
        tableConfig.data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
      }
    }
  }

  return datasetTables;
}

/** the JSON file backing `table` in the dataset directory, when there is one */
export function dataFilePath(datasetName: string, table: TableSchema): string | null {
  if (table.dataFilePath) {
    return table.dataFilePath;
  }
  const file = path.join(DATASETS_DIR, datasetName, `${table.tableName}.json`);
  return fs.existsSync(file) ? file : null;
}
