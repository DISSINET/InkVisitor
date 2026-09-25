import React from "react";
import { Box, EntityEnums, EntityTag, Panel } from "dissinet.ddb.client";

// Panel is one flex column of the four-panel workspace and is height:100%
// by nature — it takes its height from an ancestor (the app shell), so every
// demo wraps it in a div that supplies one.

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

const territories = [
  mkEntity("t-trento", EntityEnums.Class.Territory, "Council of Trent"),
  mkEntity("t-bologna", EntityEnums.Class.Territory, "Diocese of Bologna"),
  mkEntity("t-worms", EntityEnums.Class.Territory, "Diet of Worms"),
];

export const Default = () => (
  <div style={{ height: 340 }}>
    <Panel width={280}>
      <Box label="Territories" height={340}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px 8px" }}>
          {territories.map((t) => (
            <EntityTag key={t.id} entity={t} fullWidth />
          ))}
        </div>
      </Box>
    </Panel>
  </div>
);

export const Narrow = () => (
  <div style={{ height: 340 }}>
    <Panel width={140}>
      <Box label="Search" height={340} noFrame>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px 8px" }}>
          <EntityTag entity={mkEntity("p-charles", EntityEnums.Class.Person, "Charles V")} fullWidth />
        </div>
      </Box>
    </Panel>
  </div>
);

export const SideBySide = () => (
  <div style={{ height: 340, display: "flex" }}>
    <Panel width={220}>
      <Box label="Territories" height={340} borderColor="white">
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px 8px" }}>
          {territories.map((t) => (
            <EntityTag key={t.id} entity={t} fullWidth />
          ))}
        </div>
      </Box>
    </Panel>
    <Panel width={220}>
      <Box label="Statements" height={340} borderColor="white">
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px 8px" }}>
          <EntityTag entity={mkEntity("s-1", EntityEnums.Class.Statement, "Charles V convenes the council")} fullWidth />
        </div>
      </Box>
    </Panel>
  </div>
);
