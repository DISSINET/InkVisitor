import React from "react";
import {
  Box,
  EntityEnums,
  EntityTag,
  IconButton,
  IcoCollapse,
  IcoExpand,
  IcoRefresh,
} from "dissinet.ddb.client";

// Box is used at a fixed pixel height in the app (the panel gives it the
// rest); a bare container has no ambient height, so the demos below pass
// height explicitly rather than relying on a wrapping div.

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
  mkEntity("t-augsburg", EntityEnums.Class.Territory, "Peace of Augsburg"),
];

const statements = [
  mkEntity("s-1", EntityEnums.Class.Statement, "Charles V convenes the council"),
  mkEntity("s-2", EntityEnums.Class.Statement, "The legates arrive in Trento"),
  mkEntity("s-3", EntityEnums.Class.Statement, "The council issues its decrees"),
];

export const Default = () => (
  <Box label="Territories" height={340}>
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px 8px" }}>
      {territories.map((t) => (
        <EntityTag key={t.id} entity={t} fullWidth />
      ))}
    </div>
  </Box>
);

export const WithHeaderButtons = () => (
  <Box
    label="Statements"
    height={340}
    borderColor="white"
    buttons={[
      <IconButton key="refresh" icon={<IcoRefresh />} color="plain" inverted tooltipLabel="Refresh statements" onClick={() => {}} />,
      <IconButton key="collapse" icon={<IcoCollapse />} color="plain" inverted tooltipLabel="Collapse panel" onClick={() => {}} />,
    ]}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px 8px" }}>
      {statements.map((s) => (
        <EntityTag key={s.id} entity={s} fullWidth />
      ))}
    </div>
  </Box>
);

export const NoFrame = () => (
  <Box label="Search" height={340} noFrame color="primary">
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px 8px" }}>
      <EntityTag entity={mkEntity("p-charles", EntityEnums.Class.Person, "Charles V")} fullWidth />
      <EntityTag entity={mkEntity("c-hre", EntityEnums.Class.Concept, "Holy Roman Empire")} fullWidth />
    </div>
  </Box>
);

// A collapsed Box only reads as a narrow strip inside a narrowed Panel — the
// app drives that width from a redux-held panel width, so this pins the same
// effect locally with a width-constrained wrapper.
export const Collapsed = () => (
  <div style={{ width: 56 }}>
    <Box
      label="Territories"
      height={340}
      isExpanded={false}
      onHeaderClick={() => {}}
      buttons={[<IconButton key="expand" icon={<IcoExpand />} color="plain" inverted tooltipLabel="Expand panel" onClick={() => {}} />]}
    >
      <div style={{ padding: 8 }}>
        {territories.map((t) => (
          <EntityTag key={t.id} entity={t} fullWidth />
        ))}
      </div>
    </Box>
  </div>
);
