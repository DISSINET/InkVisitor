import React from "react";
import { EntityEnums, EntityTag, Table, TagGroup } from "dissinet.ddb.client";

// Table is react-table underneath: columns are the react-table Column shape
// (Header + accessor, or Header + Cell for a computed column), data is a
// plain row array. Every EntityTag cell needs a full IEntity, not a string.

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

const territoryRows = [
  { id: "t-trento", entity: mkEntity("t-trento", EntityEnums.Class.Territory, "Council of Trent"), statements: 128, updated: "1563-12-04" },
  { id: "t-bologna", entity: mkEntity("t-bologna", EntityEnums.Class.Territory, "Diocese of Bologna"), statements: 54, updated: "1547-03-11" },
  { id: "t-worms", entity: mkEntity("t-worms", EntityEnums.Class.Territory, "Diet of Worms"), statements: 76, updated: "1521-05-25" },
  { id: "t-augsburg", entity: mkEntity("t-augsburg", EntityEnums.Class.Territory, "Peace of Augsburg"), statements: 41, updated: "1555-09-25" },
  { id: "t-milan", entity: mkEntity("t-milan", EntityEnums.Class.Territory, "Duchy of Milan"), statements: 63, updated: "1540-02-14" },
  { id: "t-venice", entity: mkEntity("t-venice", EntityEnums.Class.Territory, "Republic of Venice"), statements: 89, updated: "1559-06-30" },
];

const territoryColumns: any[] = [
  {
    Header: "Territory",
    Cell: ({ row }: any) => <EntityTag entity={row.original.entity} />,
  },
  {
    Header: "Statements",
    accessor: "statements",
  },
  {
    Header: "Last updated",
    accessor: "updated",
  },
];

export const TerritoriesTable = () => (
  <Table
    columns={territoryColumns}
    data={territoryRows}
    entityTitle={{ singular: "Territory", plural: "Territories" }}
    perPage={5}
  />
);

const statementRows = [
  {
    id: "s-1",
    subject: mkEntity("p-charles", EntityEnums.Class.Person, "Charles V"),
    actants: [mkEntity("c-hre", EntityEnums.Class.Concept, "Holy Roman Empire")],
    text: "Charles V convenes the council in Trento.",
  },
  {
    id: "s-2",
    subject: mkEntity("p-legate", EntityEnums.Class.Person, "Cardinal Legate"),
    actants: [mkEntity("t-trento", EntityEnums.Class.Territory, "Council of Trent")],
    text: "The legates arrive to open the proceedings.",
  },
  {
    id: "s-3",
    subject: mkEntity("g-council", EntityEnums.Class.Group, "Council Fathers"),
    actants: [mkEntity("c-decree", EntityEnums.Class.Concept, "Decree on Justification")],
    text: "The council issues its decree on justification.",
  },
];

const statementColumns: any[] = [
  {
    Header: "Subject",
    // A narrow side column stays a compact icon+letter badge, like the real
    // EntityDetailStatementsTable's Subj/Actions/Objects columns — a
    // full-label EntityTag here gets crushed by the 1% width every
    // non-fullWidthColumn column shrinks to.
    Cell: ({ row }: any) => <EntityTag entity={row.original.subject} showOnly="tag" />,
  },
  {
    Header: "Actants",
    Cell: ({ row }: any) => <TagGroup definedEntities={row.original.actants} />,
  },
  {
    Header: "Text",
    Cell: ({ row }: any) => <div style={{ whiteSpace: "nowrap" }}>{row.original.text}</div>,
  },
];

export const StatementsTable = () => (
  <Table
    columns={statementColumns}
    data={statementRows}
    entityTitle={{ singular: "Statement", plural: "Statements" }}
    perPage={5}
    fullWidthColumn={2}
  />
);

export const CompactNoPaging = () => (
  <Table
    columns={territoryColumns}
    data={territoryRows.slice(0, 3)}
    entityTitle={{ singular: "Territory", plural: "Territories" }}
    disablePaging
    disableHeading
    noBorder
  />
);
