import { Connection } from "rethinkdb-ts";
import Generator from "../Generator";

const job = async (db: Connection) => {
  const generator = new Generator()
  await generator.getUserInfo()
  generator.generate()
  generator.output();
}

export default job
