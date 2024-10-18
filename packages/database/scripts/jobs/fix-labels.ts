import { r, Connection, RDatum } from "rethinkdb-ts";
import { IJob } from ".";

const fixLabels: IJob = async (db: Connection): Promise<void> => {
  await r
    .table("entities")
    .filter(r.row.hasFields("label"))
    .update((row: RDatum) => ({
      labels: row("label")
        .typeOf()
        .eq("STRING")
        .branch([row("label")], []),
    }))
    .run(db);
};

export default fixLabels;
