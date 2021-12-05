var { loadSheet } = require("./loadsheet.js");
var { v4 } = require("uuid");
var fs = require("fs");

import {
  ActantType,
  ActantStatus,
  EntityActantType,
  AllActantType,
  Certainty,
  Elvl,
  Position,
  Logic,
  Mood,
  MoodVariant,
  Virtuality,
  Partitivity,
  Operator,
  EntityLogicalType,
  Language,
} from "../../shared/enums";
import {
  IAudit,
  IAction,
  IActant,
  IEntity,
  IStatement,
  ITerritory,
  IResource,
} from "../../shared/types";

import { actantStatusDict } from "../../shared/dictionaries";

const entitites = JSON.parse(fs.readFileSync("datasets/all/actants.json"));

// console.log(entitites);
const now = new Date();
const audits = entitites.map((entity: IActant, ei: number) => {
  return {
    id: v4(),
    actantId: entity.id,
    user: "0",
    date: now,
    changes: {},
  };
});

console.log(audits);

fs.writeFileSync("datasets/all/audits.json", JSON.stringify(audits));
