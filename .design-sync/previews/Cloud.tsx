import React from "react";
import { Cloud, EntityEnums, EntityTag, IconButton, IcoCopy } from "dissinet.ddb.client";

// Cloud wraps an entity relation cluster (a statement's actants, a
// classification's subjects) with a single unlink control; children is one
// element, so the relation list below is one wrapping div.

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

const originEntity = mkEntity("p-charles", EntityEnums.Class.Person, "Charles V");

const relationList = (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <EntityTag entity={originEntity} isSelected fullWidth />
    <EntityTag entity={mkEntity("e-council", EntityEnums.Class.Event, "Council of Trent")} fullWidth />
    <EntityTag entity={mkEntity("c-hre", EntityEnums.Class.Concept, "Holy Roman Empire")} fullWidth />
  </div>
);

export const Default = () => (
  <Cloud onUnlink={() => {}} originEntity={originEntity}>
    {relationList}
  </Cloud>
);

export const WithTopRightSlot = () => (
  <Cloud
    onUnlink={() => {}}
    originEntity={originEntity}
    topRightSlot={
      <IconButton icon={<IcoCopy />} color="plain" inverted tooltipLabel="Copy UUIDs" onClick={() => {}} />
    }
  >
    {relationList}
  </Cloud>
);

export const Disabled = () => (
  <Cloud onUnlink={() => {}} originEntity={originEntity} disabled>
    {relationList}
  </Cloud>
);
