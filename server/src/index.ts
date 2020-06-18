var express = require("express");
import { replaceAll } from "../../shared/util/base";
import { close, runQuery } from "../../shared/util/db";

const app = express();
const port = 3000;

app.get("/text/:textId", async (req, res) => {
  console.log(req.params.textId);
  const actions_actants = await runQuery(
    "MATCH (text:T{id: '" +
      req.params.textId +
      "'})-[r_origin:ORIGINATES_IN]-(action:A)-[r_actant:HAS_ACTANT]-(actant) RETURN r_origin,action.id,r_actant,actant.id"
  );
  const ations_resources = await runQuery(
    "MATCH (text:T{id: '" +
      req.params.textId +
      "'})-[:ORIGINATES_IN]-(action:A)-[r_reference:HAS_REFERENCE_IN]-(resource:R) RETURN action.id,r_reference,resource.id"
  );
  const actions = await runQuery(
    "MATCH (text:T{id: '" +
      req.params.textId +
      "'})-[:ORIGINATES_IN]-(action:A) RETURN action"
  );
  const actants = await runQuery(
    "MERGE (text:T{id: '" +
      req.params.textId +
      "'})-[:ORIGINATES_IN]-(:A)-[:HAS_ACTANT]-(actant) RETURN actant"
  );
  const texts = {
    down: await runQuery(
      "MATCH (:T{id: '" +
        req.params.textId +
        "'})-[r_part:IS_PART_OF]->(text:T) RETURN text, r_part"
    ),
    up: await runQuery(
      "MATCH (:T{id: '" +
        req.params.textId +
        "'})<-[r_part:IS_PART_OF]-(text:T) RETURN text, r_part"
    ),
  };

  close();
  res.send({
    actants,
    texts,
    actions,
    ations_resources,
    actions_actants,
  });
});

app.get("/", (req, res) => res.send("Hello!"));

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
