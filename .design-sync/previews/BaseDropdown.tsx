import React from "react";
import { BaseDropdown, IcoSearch } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

const territoryOptions = [
  { value: "T1", label: "Council of Trent" },
  { value: "T2", label: "Holy Roman Empire" },
  { value: "T3", label: "Duchy of Milan" },
  { value: "T4", label: "Republic of Venice" },
];

const classOptions = [
  { value: "P", label: "Person" },
  { value: "T", label: "Territory" },
  { value: "A", label: "Action" },
  { value: "C", label: "Concept" },
  { value: "E", label: "Event" },
];

export const Default = () => (
  <BaseDropdown
    width={220}
    options={territoryOptions}
    value={territoryOptions[1]}
    onChange={() => {}}
    placeholder="Select territory"
  />
);

export const MultiSelect = () => (
  <BaseDropdown
    width={280}
    isMulti
    options={classOptions}
    value={[classOptions[0], classOptions[3]]}
    onChange={() => {}}
    placeholder="Select entity classes"
  />
);

export const WithIcon = () => (
  <BaseDropdown
    width={220}
    icon={<IcoSearch />}
    options={territoryOptions}
    value={territoryOptions[0]}
    tooltipLabel="Territory filter"
    onChange={() => {}}
  />
);

export const DisabledAndLoading = () => (
  <Row>
    <BaseDropdown
      width={200}
      options={territoryOptions}
      value={territoryOptions[2]}
      disabled
      onChange={() => {}}
    />
    <BaseDropdown
      width={200}
      options={territoryOptions}
      value={null as any}
      loading
      placeholder="Loading territories…"
      onChange={() => {}}
    />
  </Row>
);
