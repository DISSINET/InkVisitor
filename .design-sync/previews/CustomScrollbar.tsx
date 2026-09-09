import React from "react";
import { CustomScrollbar, EntityEnums, EntityTag } from "dissinet.ddb.client";

// CustomScrollbar renders as tall as its parent (100% by default), so every
// demo pins contentHeight itself and gives it content well past that height,
// otherwise there is nothing to scroll and the track never appears.

const mkEntity = (id: string, cls: string, label: string, status = "1"): any => ({
  id,
  class: cls,
  status,
  data: {},
  labels: [label],
  detail: "",
  language: "eng",
  notes: [],
  props: [],
  references: [],
});

const territoryNames = [
  "Council of Trent",
  "Diocese of Bologna",
  "Diet of Worms",
  "Peace of Augsburg",
  "Diocese of Trento",
  "Kingdom of Bohemia",
  "Duchy of Milan",
  "Republic of Venice",
  "Papal States",
  "Electorate of Saxony",
];

export const Default = () => (
  <CustomScrollbar scrollerId="preview-territories" contentHeight={220}>
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px 8px" }}>
      {territoryNames.map((name, i) => (
        <EntityTag key={name} entity={mkEntity(`t-${i}`, EntityEnums.Class.Territory, name)} fullWidth />
      ))}
    </div>
  </CustomScrollbar>
);

export const NoScrollY = () => (
  <CustomScrollbar scrollerId="preview-actants" contentHeight={80} noScrollY>
    <div style={{ display: "flex", gap: 6, padding: "4px 8px", width: 900 }}>
      {territoryNames.map((name, i) => (
        <EntityTag key={name} entity={mkEntity(`a-${i}`, EntityEnums.Class.Concept, name)} />
      ))}
    </div>
  </CustomScrollbar>
);
