var { loadSheet } = require("./loadsheet.js");
var { v4 } = require("uuid");
var fs = require("fs");

import { IEntity } from "../../shared/types";

const entitites = JSON.parse(fs.readFileSync("datasets/all/entities.json"));

// console.log(entitites);
const now = new Date();
const audits = entitites.map((entity: IEntity, ei: number) => {
  return {
    id: v4(),
    entityId: entity.id,
    user: "0",
    date: now,
    changes: {},
  };
});

console.log(audits);

fs.writeFileSync("datasets/all/audits.json", JSON.stringify(audits));
