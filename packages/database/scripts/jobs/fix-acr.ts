import { r, Connection, RDatum } from "rethinkdb-ts";
import { IJob } from ".";
import Dataset from "./Dataset";
import { question } from "../import/prompts";
import { IEntity } from "@shared/types";
import { EntityEnums } from "@shared/enums";
import Value from "@models/value/value";
import Entity from "@models/entity/entity";
import { ModelNotValidError } from "@shared/types/errors";

const save = async (
  db: Connection | undefined,
  entity: IEntity
): Promise<boolean> => {
  entity.createdAt = new Date();

  const result = await r
    .table(Entity.table)
    .insert({ ...entity, id: undefined })
    .run(db);

  if (result.generated_keys) {
    entity.id = result.generated_keys[0];
  }

  if (result.first_error && result.first_error.indexOf("Duplicate") !== -1) {
    throw new ModelNotValidError("id already exists");
  }

  return result.inserted === 1;
};

const fixACRLabels: IJob = async (db: Connection): Promise<void> => {
  const dir = await question(
    "which directory?",
    (input: string): string => {
      return input;
    },
    ""
  );

  if (!dir) {
    throw new Error("cannot continue without dir");
  }

  const dataset = new Dataset(dir);
  const localEntities = await dataset.loadData("entities.json");
  console.log(
    localEntities.filter(
      (l) =>
        l.class === EntityEnums.Class.Action ||
        l.class === EntityEnums.Class.Concept
    ).length
  );

  while (true) {
    const todo = (await r
      .table("entities")
      .filter(function (row: RDatum) {
        return row("references").contains(function (ref: RDatum) {
          return ref("value").eq(row("id"));
        });
      })
      .limit(10)
      .run(db)) as IEntity[];

    if (todo.length === 0) {
      break;
    }

    for (const item of todo) {
      const ref = item.references.find(
        (r) => r.value === item.id && r.resource === "dissinet-resource"
      );
      if (!ref) {
        console.warn(`Entity ${item.id} without original reference`);
        continue;
      }

      const v = new Value({
        labels: [item.id],
      });

      await save(db, v);
      if (!v.id) {
        console.warn(`Entity ${item.id} without V entity`);
        continue;
      }

      // @ts-ignore
      ref.value = v.id;

      console.log("Updating", item.id);
      await r
        .table("entities")
        .get(item.id)
        .update({
          references: item.references,
        })
        .run(db);
    }
  }
};

export default fixACRLabels;
