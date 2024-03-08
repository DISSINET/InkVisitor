import { r, Connection } from "rethinkdb-ts";
import { IJob } from ".";
import Dataset from "./Dataset";
import { question } from "../import/prompts";
import { IEntity } from "@shared/types";

const fixACRLabels: IJob = async (db: Connection): Promise<void> => {
  const dir = await question("which directory?", (input: string): string => {
    return input;
  }, "");

  if (!dir) {
    throw new Error("cannot continue without dir");
  }

  const dataset = new Dataset(dir);
  const localEntities = await dataset.loadData("entities.json")

  // find entity from json in database and replace its label to id
  for (const localEntity of localEntities) {    
    // this should be intacted
    if (localEntity.id === "dissinet-resource") {
      continue
    }
    
    const storedEntity = (await r.table("entities").get(localEntity.id).run(db) as IEntity)
    if (!storedEntity) {
      console.warn(`Entity ${localEntity.id} not found in database`)
      continue
    }
    await r.table("entities").update({
      label: storedEntity.id,
    }).run(db);
  }
}

export default fixACRLabels;
