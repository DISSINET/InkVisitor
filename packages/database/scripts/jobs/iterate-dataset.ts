import { Connection } from "rethinkdb-ts";
import { IJob } from ".";
import * as fs from "fs";
import { IEntity } from "@shared/types";

const iterateDataset: IJob = async (db: Connection): Promise<void> => {
  const path = "./datasets/production/entities.json";
  const data = JSON.parse(fs.readFileSync(path, "utf8")) as IEntity[];
  data.forEach((element) => {
    console.log(JSON.stringify(element, null, 4));
  });

  //  fs.writeFileSync(path, JSON.stringify(data, null, 4));
};

export default iterateDataset;
