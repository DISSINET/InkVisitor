var inActants = require("./data/actants");
var inStatements = require("./data/statements");

var fs = require("fs");
var csv = require("csv-parser");

const actants = [];

// parse actants
inActants.forEach((inActant) => {
  newActant = {
    id: inActant.codeid,
    label: inActant.label,
    class: "E",
    data: {
      type: inActant.type[0],
    },
  };

  actants.push(newActant);
});

const territoryIds = [];

// parse statements
inStatements.forEach((inStatement) => {
  newActant = {
    id: inStatement._source_id,
    label: "",
    class: "S",
    data: {
      action: inStatement.actionId,
      territory: inStatement.territoryId,
      references: [],
      certainty: 1,
      elvl: inStatement.epistemicLevel,
      modality: 1,
      text: inStatement.text,
      note: inStatement.note,
      props: [],
      actants: [],
    },
  };

  inStatement.tree.actants.forEach((inStatementActant) => {
    newActant.data.actants.push({
      id: inStatementActant._label,
      position: inStatementActant.type,
      elvl: 1,
      certainty: 1,
      props: [],
    });
  });

  const statementTerritoryId = inStatement.territoryId;
  if (statementTerritoryId && !territoryIds.includes(statementTerritoryId)) {
    territoryIds.push(statementTerritoryId);
  }

  actants.push(newActant);
});

//parse territories
territoryIds.forEach((territoryId) => {
  const newActant = {
    id: territoryId,
    label: territoryId,
    class: "T",
    data: { parent: "T3-1", content: "", type: 0, language: "Lang1" },
  };
  actants.push(newActant);
});

// root territories
actants.push({
  id: "T3-1",
  label: "T3-1",
  class: "T",
  data: { parent: "T3", content: "", type: 0, language: "Lang1" },
});
actants.push({
  id: "T3",
  label: "T3",
  class: "T",
  data: { parent: false, content: "", type: 0, language: "Lang1" },
});

fs.writeFileSync("./actants.json", JSON.stringify(actants));

// parse actions.tsv
const actions = [];

fs.createReadStream("data/actions.csv")
  .pipe(csv())
  .on("headers", (headers) => {
    console.log(headers);
  })
  .on("data", (data) => {
    actions.push({
      id: data["id_action_or_relation"],
      parent: data["parent_id"] || false,
      note: data["note"],
      labels: [
        { label: data["action_or_relation"], language: "Lang1" },
        { label: data["action_or_relation_english"], language: "Lang2" },
      ],
      types: [],
      valencies: [],
      rulesActants: [],
      rulesProperties: [],
    });
  })
  .on("end", () => {
    fs.writeFileSync("./actions.json", JSON.stringify(actions));
  });
