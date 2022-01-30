import { EntityClass } from "../../shared/enums";

const fs = require("fs");

const path = "datasets/all/entities.json";
let data = JSON.parse(fs.readFileSync(path));
const ters = (data as any[]).filter((d) => d.class === EntityClass.Territory);
const mapByParent: any = {};
for (const entry of ters) {
  if (!entry.data.parent || !entry.data.parent.id) {
    continue;
  }
  if (!mapByParent[entry.data.parent.id]) {
    mapByParent[entry.data.parent.id] = [];
  }

  mapByParent[entry.data.parent.id].push(entry);
}

for (const parentId of Object.keys(mapByParent)) {
  for (const i in mapByParent[parentId]) {
    const entry = mapByParent[parentId][i];
    entry.data.parent.order = parseInt(i);
  }
}

fs.writeFileSync(path, JSON.stringify(data));
